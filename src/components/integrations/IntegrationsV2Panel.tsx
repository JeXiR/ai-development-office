"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useIntegrationV2Store} from "@/store/useIntegrationV2Store";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function IntegrationsV2Panel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=useIntegrationV2Store();
  const [integrationId,setIntegrationId]=useState("github");
  const [action,setAction]=useState("create_issue");
  const [payload,setPayload]=useState('{"repo":"owner/repo","title":"Office integration test","body":"Created from AI Development Office"}');
  const [watchResource,setWatchResource]=useState("");

  useWhenOfficeConnected(()=>{if(projectId)send({action:"integration_v2_snapshot",project_id:projectId});},[projectId]);

  const execute=()=>{
    if(!projectId)return;
    let parsed:any={};
    try{parsed=JSON.parse(payload);}catch{return;}
    send({action:"integration_v2_execute",project_id:projectId,integration_id:integrationId,integration_action:action,payload:parsed,actor:"user"});
  };

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("integrationsV2.eyebrow")}</div><h2>{t("integrationsV2.title")}</h2></div>
      <button onClick={()=>projectId&&send({action:"integration_v2_snapshot",project_id:projectId})}>{t("common.refresh")}</button>
    </div>

    <div className="integrationv2-compose">
      <select value={integrationId} onChange={e=>setIntegrationId(e.target.value)}>
        <option value="github">GitHub</option><option value="gitlab">GitLab</option><option value="slack">Slack</option>
        <option value="discord">Discord</option><option value="jira">Jira</option><option value="linear">Linear</option>
        <option value="notion">Notion</option><option value="sentry">Sentry</option><option value="ci">CI</option><option value="webhook">Webhook</option>
      </select>
      <input value={action} onChange={e=>setAction(e.target.value)} placeholder={t("integrationsV2.actionPlaceholder")}/>
      <textarea value={payload} onChange={e=>setPayload(e.target.value)} />
      <button onClick={execute}>{t("integrationsV2.execute")}</button>
    </div>

    {state.lastResult?<div className="integration-result"><strong>{state.lastResult.ok?t("common.success"):t("common.failed")}</strong><span>{state.lastResult.status??"network"} · {state.lastResult.message}</span></div>:null}

    <div className="integration-watch-row">
      <input value={watchResource} onChange={e=>setWatchResource(e.target.value)} placeholder={t("integrationsV2.watchPlaceholder")}/>
      <button onClick={()=>projectId&&watchResource&&send({action:"integration_watch_add",project_id:projectId,integration_id:"ci",kind:"ci-status",resource:watchResource,interval_minutes:15})}>{t("integrationsV2.addWatch")}</button>
    </div>

    <div className="integration-watch-list">
      {state.watches.map(w=><article key={w.id}><div><strong>{w.kind}</strong><small>{w.integrationId} · {w.resource}</small><span>{w.lastState||t("integrationsV2.notChecked")}</span></div><div><button onClick={()=>projectId&&send({action:"integration_watch_check",project_id:projectId,watch_id:w.id})}>{t("integrationsV2.check")}</button><button onClick={()=>projectId&&send({action:"integration_watch_remove",project_id:projectId,watch_id:w.id})}>{t("common.remove")}</button></div></article>)}
    </div>

    <div className="integration-audit-list">
      {state.audit.slice().reverse().slice(0,40).map(a=><article key={a.id}><span>{a.status}</span><div><strong>{a.integrationId}:{a.action}</strong><small>{t("integrationsV2.attempt").replace("{n}",String(a.attempt))} · {a.durationMs}ms · {new Date(a.createdAt).toLocaleString()}</small><p>{a.message}</p></div></article>)}
    </div>
  </section>;
}