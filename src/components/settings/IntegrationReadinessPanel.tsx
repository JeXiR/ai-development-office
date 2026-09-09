"use client";

import {useMemo,useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function IntegrationReadinessPanel(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const activeProject=useMemo(()=>projects.find((p:any)=>p.id===activeProjectId)||null,[projects,activeProjectId]);
  const [snapshot,setSnapshot]=useState<any>(null);

  const request=()=>{
    sendOffice({action:"get_integration_readiness",data:{projectPath:activeProject?.path||null}});
  };

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="integration_readiness")setSnapshot(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    request();
    return()=>socket.removeEventListener("message",onMessage);
  },[activeProject?.id]);

  return <section className="panel integration-readiness-panel" data-help="integration-readiness">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("settings.healthEyebrow")}</div>
        <h2>{t("settings.healthTitle")}</h2>
      </div>
      <span>{snapshot?.ready?"READY":snapshot?"NOT READY":"UNKNOWN"}</span>
    </div>

    <div className="skills-toolbar">
      <button onClick={request}>{t("settings.refreshIntegration")}</button>
    </div>

    <div className="integration-check-grid">
      {(snapshot?.checks||[]).map((row:any)=><article key={row.id} data-ok={row.ok?"true":"false"}>
        <div><strong>{row.subsystem}</strong><span>{row.ok?"PASS":row.severity.toUpperCase()}</span></div>
        <small>{row.message}</small>
      </article>)}
    </div>

    {snapshot?<p className="muted">{snapshot.errors} error(s) · {snapshot.warnings} warning(s)</p>:null}
  </section>;
}
