"use client";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useProvenanceStore} from "@/store/useProvenanceStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function ReproducibilityPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const events=useProvenanceStore(s=>s.events);

  useWhenOfficeConnected(()=>{
    if(projectId)send({action:"provenance_snapshot",project_id:projectId,limit:300});
  },[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("repro.eyebrow")}</div><h2>{t("repro.title")}</h2></div>
      <div>
        <button disabled={!projectId} onClick={()=>projectId&&send({action:"state_migrate",project_id:projectId})}>{t("repro.migrate")}</button>
        <button disabled={!projectId} onClick={()=>projectId&&send({action:"provenance_replay",project_id:projectId,limit:1000})}>{t("repro.replay")}</button>
      </div>
    </div>

    <div className="provenance-list">
      {events.slice(-30).reverse().map(e=><article key={e.id}>
        <span>{e.type}</span>
        <div><strong>{e.action}</strong><small>{e.actor} · {new Date(e.createdAt).toLocaleString()}</small></div>
      </article>)}
      {!events.length?<div className="workspace-empty">{t("repro.none")}</div>:null}
    </div>
  </section>;
}