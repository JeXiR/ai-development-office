"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function CollaborationGraphPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const history=useOfficeStore(s=>s.commandHistory);

  const rows=useMemo(()=>history
    .filter(c=>c.projectId===state.projectId&&(c.workItemId||c.findingId))
    .filter(c=>(c.collaboratorRoles?.length||c.collaboratorCodingRoles?.length||c.verifierStatus))
    .slice(0,12),[history,state.projectId]);

  return <section className="panel collaboration-graph-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("tasks.collabEyebrow")}</div><h2>{t("tasks.collabTitle")}</h2></div></div>
    <div className="collaboration-list">
      {rows.map(row=><article className="collaboration-flow" key={row.id}>
        <div className="collab-subject"><strong>{row.workItemId||row.findingId}</strong><span>{row.executionMode||"solo"}</span></div>
        <div className="collab-node lead"><b>{row.leadRole||row.assignedRole||t("tasks.lead")}</b><span>{t("tasks.collabLead")}</span></div>
        <em>→</em>
        <div className="collab-node-group">
          {(row.collaboratorRoles||[]).length?(row.collaboratorRoles||[]).map(role=>{
            const coding=row.collaboratorCodingRoles?.includes(role);
            const status=row.collaboratorStatus?.[role]||"waiting";
            return <div className={`collab-node ${coding?"coding":"review"} status-${status}`} key={role}><b>{role}</b><span>{coding?t("tasks.collabCoding"):t("tasks.collabReview")} · {status}</span></div>;
          }):<div className="collab-node na"><b>{t("tasks.noCollab")}</b><span>—</span></div>}
        </div>
        <em>→</em>
        <div className={`collab-node verifier status-${row.verifierStatus||"waiting"}`}><b>{t("tasks.stageVerifier")}</b><span>{row.verifierStatus||"waiting"} · {t("tasks.drift")} {row.driftStatus||"—"}</span></div>
      </article>)}
      {!rows.length?<div className="muted graph-empty">{t("tasks.collabEmpty")}</div>:null}
    </div>
  </section>;
}
