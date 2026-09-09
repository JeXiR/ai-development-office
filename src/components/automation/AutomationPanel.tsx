"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useAutomationStore} from "@/store/useAutomationStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function AutomationPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const snapshot=useAutomationStore(s=>s.snapshot);
  const [title,setTitle]=useState("");
  const [prompt,setPrompt]=useState("");
  const [cadence,setCadence]=useState("once");

  useWhenOfficeConnected(()=>{
    if(projectId)send({action:"automation_snapshot",project_id:projectId});
  },[projectId]);

  const create=()=>{
    if(!projectId||!title.trim()||!prompt.trim())return;
    send({
      action:"automation_create",
      project_id:projectId,
      title:title.trim(),
      prompt:prompt.trim(),
      cadence,
      provider:"auto",
      role:"general",
      max_retries:2
    });
    setTitle("");setPrompt("");
  };

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("automation.eyebrow")}</div><h2>{t("automation.title")}</h2></div>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"automation_run_due",project_id:projectId})}>{t("automation.runDue")}</button>
    </div>

    <div className="automation-compose">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t("automation.namePlaceholder")}/>
      <select value={cadence} onChange={e=>setCadence(e.target.value)}>
        <option value="once">{t("automation.once")}</option><option value="hourly">{t("automation.hourly")}</option><option value="daily">{t("automation.daily")}</option><option value="weekly">{t("automation.weekly")}</option>
      </select>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={t("automation.promptPlaceholder")}/>
      <button onClick={create}>{t("automation.schedule")}</button>
    </div>

    <div className="automation-list">
      {snapshot.missions.slice().reverse().map(m=><article key={m.id}>
        <div><strong>{m.title}</strong><small>{t(`automation.${m.cadence}`,m.cadence)} · {m.status} · {t("automation.next")} {new Date(m.nextRunAt).toLocaleString()}</small></div>
        <span>{t("automation.retries").replace("{n}",String(m.retryCount)).replace("{max}",String(m.maxRetries))}</span>
        <button onClick={()=>projectId&&send({action:"automation_remove",project_id:projectId,mission_id:m.id})}>{t("automation.remove")}</button>
      </article>)}
      {!snapshot.missions.length?<div className="workspace-empty">{t("automation.empty")}</div>:null}
    </div>

    <div className="heartbeat-row">
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"heartbeat_configure",project_id:projectId,enabled:true,interval_minutes:15})}>{t("automation.heartbeat")}</button>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"heartbeat_now",project_id:projectId})}>{t("automation.heartbeatNow")}</button>
      {snapshot.heartbeats.map(h=><span key={h.projectId}>{h.enabled?t("common.enabled"):t("common.disabled")} · {t("automation.next")} {h.nextBeatAt?new Date(h.nextBeatAt).toLocaleTimeString():"—"}</span>)}
    </div>
  </section>;
}
