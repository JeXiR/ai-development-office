"use client";
import { useMemo } from "react";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
export function SubtaskContractPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState(),history=useOfficeStore(s=>s.commandHistory);
  const rows=useMemo(()=>history.filter(c=>c.projectId===state.projectId&&(c.workItemId||c.findingId)).slice(0,18),[history,state.projectId]);
  return <section className="panel contract-panel"><div className="section-heading"><div><div className="eyebrow">{t("tasks.contractEyebrow")}</div><h2>{t("tasks.contractTitle")}</h2></div></div><div className="contract-table"><div className="contract-row head"><span>{t("tasks.colTask")}</span><span>{t("tasks.colRole")}</span><span>{t("tasks.ownedFiles")}</span><span>{t("tasks.ownership")}</span><span>{t("tasks.contract")}</span></div>{rows.map(row=><div className="contract-row" key={row.id}><strong>{row.workItemId||row.findingId}</strong><span>{row.leadRole||row.assignedRole||"—"}</span><span>{row.ownedFiles?.length??0}</span><b className={`ownership-${row.ownershipStatus||"not_required"}`}>{row.ownershipStatus||"not_required"}</b><code>{row.subtaskContractPath||"—"}</code></div>)}</div></section>;
}
