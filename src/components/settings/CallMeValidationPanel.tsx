"use client";

import {useMemo,useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function CallMeValidationPanel(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const activeProject=useMemo(()=>projects.find((p:any)=>p.id===activeProjectId)||null,[projects,activeProjectId]);
  const [snapshot,setSnapshot]=useState<any>(null);
  const [result,setResult]=useState<any>(null);
  const [running,setRunning]=useState(false);

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="callme_validation_readiness")setSnapshot(m.data);
        if(m.type==="callme_validation_result"){setResult(m.data);setRunning(false);}
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    if(activeProject)send("get_callme_validation_readiness",{projectPath:activeProject.path});
    return()=>socket.removeEventListener("message",onMessage);
  },[activeProject?.id]);

  const run=()=>{
    if(!activeProject||running)return;
    setRunning(true);
    setResult(null);
    send("run_callme_validation",{projectPath:activeProject.path});
  };

  const readiness=snapshot?.readiness;
  if(!snapshot)return null;
  if(!readiness?.detection?.isCallMeCompatible)return null;

  return <section className="panel callme-validation-panel" data-help="callme-validation">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("settings.callMeEyebrow")}</div>
        <h2>{t("settings.callMeTitle")}</h2>
      </div>
      <span>{result?result.passed?t("callme.pass"):t("callme.fail"):readiness?.ready?t("callme.ready"):t("callme.notReady")}</span>
    </div>

    <p className="muted">
      {t("settings.callMeHint")}
    </p>

    <div className="skills-toolbar">
      <button disabled={!activeProject||running||!readiness?.ready} onClick={run}>
        {running?t("settings.callMeRunning"):t("settings.runCallMe")}
      </button>
    </div>

    <div className="integration-check-grid">
      {(readiness?.checks||[]).map((row:any)=><article key={row.id} data-ok={row.ok?"true":"false"}>
        <div><strong>{row.id}</strong><span>{row.ok?t("callme.pass"):row.required?t("callme.fail"):t("callme.warn")}</span></div>
        <small>{row.message}</small>
      </article>)}
    </div>

    {result?<div className="callme-validation-results">
      <strong>{result.passed?t("callme.passed"):t("callme.failed")}</strong>
      <small>{result.startedAt} → {result.completedAt}</small>
      {(result.commands||[]).map((row:any)=><div key={row.id}>
        <span>{row.ok?t("callme.pass"):t("callme.fail")}</span>
        <code>{row.command}</code>
      </div>)}
      <small>{t("callme.gitStable").replace("{value}",t((result.git?.headBefore===result.git?.headAfter&&result.git?.statusBefore===result.git?.statusAfter)?"common.yes":"common.no"))}</small>
      <small>{t("callme.report").replace("{path}",result.reportPath||"—")}</small>
    </div>:null}
  </section>;
}
