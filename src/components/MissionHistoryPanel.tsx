"use client";

import {useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useOfficeStore} from "@/store/useOfficeStore";

export function MissionHistoryPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<any[]>([]);
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const visible=rows.filter(row=>!projectId||!row.projectId||row.projectId===projectId);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="mission_history")setRows(Array.isArray(m.data)?m.data:[]);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    sendOffice({action:"get_mission_history",data:{limit:50}});
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel mission-history-panel" data-help="mission-history">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("history.eyebrow")}</div>
        <h2>{t("history.title")}</h2>
      </div>
      <span>{visible.length} {t("history.recent")}</span>
    </div>

    <div className="mission-history-list">
      {visible.length?visible.slice().reverse().map(row=><article key={row.missionId}>
        <div>
          <strong>{row.goal}</strong>
          <span>{row.status}</span>
        </div>
        <small>{row.missionId}</small>
        <small>{row.startedAt} → {row.completedAt||t("history.running")}</small>
        <small>{Array.isArray(row.providerSummary)?row.providerSummary.map((x:any)=>`${x.agentId}:${x.providerId||t("common.none")}(${x.attempts})`).join(" · "):""}</small>
      </article>):<p className="muted">{t("history.none")}</p>}
    </div>
  </section>;
}
