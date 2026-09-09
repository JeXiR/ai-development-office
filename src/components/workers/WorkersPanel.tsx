"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkerStore} from "@/store/useWorkerStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
const send=sendOffice;

export function WorkersPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const states=useWorkerStore(s=>s.states);
  const [id,setId]=useState("local-1");
  const [kind,setKind]=useState("local");
  const [host,setHost]=useState("");
  const [container,setContainer]=useState("");

  const refresh=()=>projectId&&send({action:"workers_snapshot",project_id:projectId});
  useWhenOfficeConnected(()=>{refresh();},[projectId]);

  return <section className="panel">
    <div className="section-heading"><div><div className="eyebrow">{t("workers.eyebrow")}</div><h2>{t("workers.title")}</h2></div><button onClick={refresh}>{t("common.refresh")}</button></div>
    <div className="worker-compose">
      <input value={id} onChange={e=>setId(e.target.value)} placeholder={t("workers.idPlaceholder")}/>
      <select value={kind} onChange={e=>setKind(e.target.value)}><option value="local">{t("workers.kindLocal")}</option><option value="ssh">SSH</option><option value="docker">Docker</option></select>
      <input value={host} onChange={e=>setHost(e.target.value)} placeholder={t("workers.sshHost")}/>
      <input value={container} onChange={e=>setContainer(e.target.value)} placeholder={t("workers.dockerContainer")}/>
      <button onClick={()=>projectId&&send({action:"worker_upsert",project_id:projectId,id,name:id,kind,enabled:true,host:host||null,user:null,port:null,container:container||null,workdir:null,tags:[],max_concurrent:1})}>{t("workers.save")}</button>
    </div>
    <div className="worker-grid">
      {states.map(w=><article key={w.config.id}><strong>{w.config.name}</strong><small>{w.config.kind} · {w.status}</small><p>{w.message}</p><button onClick={()=>projectId&&send({action:"worker_remove",project_id:projectId,id:w.config.id})}>{t("common.remove")}</button></article>)}
      {!states.length?<div className="workspace-empty">{t("workers.none")}</div>:null}
    </div>
  </section>;
}