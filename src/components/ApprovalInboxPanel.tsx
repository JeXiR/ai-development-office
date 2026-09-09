"use client";

import {useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function ApprovalInboxPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<any[]>([]);
  const send=(action:string,data?:any)=>{sendOffice({action,data});};
  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="approval_inbox")setRows(Array.isArray(m.data)?m.data:[]);
        if(m.type==="approval_decision")send("get_approval_inbox");
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    send("get_approval_inbox");
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel approval-inbox-panel" data-help="approval-inbox">
    <div className="section-heading">
      <div><div className="eyebrow">{t("approval.eyebrow")}</div><h2>{t("approval.title")}</h2></div>
      <span>{rows.filter(x=>x.status==="pending").length} {t("approval.pending")}</span>
    </div>
    <div className="mission-history-list">
      {rows.length?rows.slice().reverse().map(row=><article key={row.id}>
        <div><strong>{row.goal}</strong><span>{row.risk} · {row.status}</span></div>
        <small>{(row.reasons||[]).join(" · ")}</small>
        {row.status==="pending"?<div className="skills-toolbar">
          <button onClick={()=>send("decide_approval",{id:row.id,status:"approved"})}>{t("common.approve")}</button>
          <button onClick={()=>send("decide_approval",{id:row.id,status:"rejected"})}>{t("common.reject")}</button>
        </div>:null}
      </article>):<p className="muted">{t("approval.none")}</p>}
    </div>
  </section>;
}
