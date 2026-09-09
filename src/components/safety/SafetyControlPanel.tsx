"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {useSafetyStore} from "@/store/useSafetyStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function SafetyControlPanel(){const{t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const sessions=useWorkspaceStore(s=>s.runtimeSessions);
  const selected=useWorkspaceStore(s=>s.selectedRuntimeSessionId);
  const select=useWorkspaceStore(s=>s.selectRuntimeSession);
  const policy=useSafetyStore(s=>s.policy);
  const incidents=useSafetyStore(s=>s.incidents);
  const [message,setMessage]=useState("");

  useWhenOfficeConnected(()=>{
    if(projectId)send({action:"safety_snapshot",project_id:projectId});
  },[projectId]);

  const control=(action:string)=>{
    if(!selected)return;
    send({action,session_id:selected,message});
    if(action==="runtime_steer"||action==="runtime_constrain")setMessage("");
  };

  return <section className="panel safety-control-panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("safety.title").toUpperCase()}</div><h2>{t("safety.subtitle")}</h2></div>
      <span>{t("safety.incidents").replace("{n}",String(incidents.length))}</span>
    </div>

    <div className="safety-policy-grid">
      <article><strong>{t("safety.repeatedErrors")}</strong><span>{policy?.repeatedErrorThreshold??"-"}</span></article>
      <article><strong>{t("safety.repeatedCommands")}</strong><span>{policy?.repeatedCommandThreshold??"-"}</span></article>
      <article><strong>{t("safety.noProgress")}</strong><span>{policy?.noProgressThreshold??"-"}</span></article>
      <article><strong>{t("safety.timeCeiling")}</strong><span>{policy?.maxRuntimeMinutes==null?"-":t("safety.min").replace("{n}",String(policy.maxRuntimeMinutes))}</span></article>
      <article><strong>{t("safety.tokenCeiling")}</strong><span>{policy?.maxTokens??"-"}</span></article>
      <article><strong>{t("safety.costCeiling")}</strong><span>${policy?.maxCostUsd??"-"}</span></article>
    </div>

    <div className="safety-controls">
      <select value={selected||""} onChange={e=>select(e.target.value||null)}>
        <option value="">{t("safety.selectSession")}</option>
        {sessions.map(s=><option key={s.id} value={s.id}>{s.agentId} · {s.provider} · {s.status}</option>)}
      </select>
      <input value={message} onChange={e=>setMessage(e.target.value)} placeholder={t("safety.steerPlaceholder")}/>
      <button disabled={!selected} onClick={()=>control("runtime_pause")}>{t("safety.pause")}</button>
      <button disabled={!selected} onClick={()=>control("runtime_resume")}>{t("safety.resume")}</button>
      <button disabled={!selected||!message.trim()} onClick={()=>control("runtime_steer")}>{t("safety.steer")}</button>
      <button disabled={!selected||!message.trim()} onClick={()=>control("runtime_constrain")}>{t("safety.constrain")}</button>
      <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_terminate",session_id:selected})}>{t("safety.terminate")}</button>
    </div>

    <div className="safety-incidents">
      {incidents.slice(-12).reverse().map(i=><article key={i.id}>
        <div><strong>{i.reason}</strong><small>{i.agentId} · {i.action}</small></div>
        <p>{i.message}</p>
      </article>)}
      {!incidents.length?<div className="workspace-empty">{t("safety.noIncidents")}</div>:null}
    </div>
  </section>;
}
