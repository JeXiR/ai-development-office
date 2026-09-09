"use client";
import {useEffect} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useReplayStore} from "@/store/useReplayStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
const send=sendOffice;

export function SessionReplayPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const sessions=useReplayStore(s=>s.sessions);
  const selected=useReplayStore(s=>s.selected);
  useEffect(()=>{if(projectId)send({action:"replay_sessions",project_id:projectId});},[projectId]);

  return <section className="panel">
    <div className="section-heading"><div><div className="eyebrow">{t("replay.eyebrow")}</div><h2>{t("replay.title")}</h2></div></div>
    <div className="replay-layout">
      <aside>{sessions.map(id=><button key={id} onClick={()=>projectId&&send({action:"replay_session",project_id:projectId,session_id:id})}>{id}</button>)}</aside>
      <div>{selected?.events.map(e=><article key={e.id}><strong>{e.type}</strong><small>{new Date(e.timestamp).toLocaleString()} · {e.agentId}</small><pre>{JSON.stringify(e.payload,null,2)}</pre></article>)}{!selected?<div className="workspace-empty">{t("replay.select")}</div>:null}</div>
    </div>
  </section>;
}