"use client";

import { useState } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";
import type { AuditCadence } from "@/types/mission";

const defaults=[
  {id:"daily-status",labelKey:"audits.dailyStatus",command:"status"},
  {id:"project-review",labelKey:"audits.projectReview",command:"review project"},
  {id:"coverage-refresh",labelKey:"audits.coverageRefresh",command:"project coverage"},
];

export function ScheduledAuditsPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const settings=useOfficeStore(s=>s.missionSettings);
  const current=settings.scheduledAudits.filter(a=>a.projectId===state.projectId);
  const send=(id:string,labelKey:string,command:string,cadence:AuditCadence)=>{
    sendOffice({action:"set_scheduled_audit",project_id:state.projectId,id,label:t(labelKey),command,cadence,enabled:cadence!=="off"});
  };

  return <section className="panel scheduled-audits">
    <div className="section-heading"><div><div className="eyebrow">{t("audits.eyebrow")}</div><h2>{t("audits.title")}</h2></div></div>
    <div className="audit-list">
      {defaults.map(item=>{
        const saved=current.find(a=>a.id===item.id);
        const cadence=saved?.enabled?saved.cadence:"off";
        return <div className="audit-row" key={item.id}>
          <div><strong>{t(item.labelKey)}</strong><span>{item.command}</span></div>
          <select value={cadence} onChange={e=>send(item.id,item.labelKey,item.command,e.target.value as AuditCadence)}>
            <option value="off">{t("audits.off")}</option><option value="daily">{t("audits.daily")}</option><option value="weekly">{t("audits.weekly")}</option>
          </select>
          <small>{saved?.nextRunAt?t("audits.next").replace("{when}",new Date(saved.nextRunAt).toLocaleString()):t("audits.notScheduled")}</small>
        </div>;
      })}
    </div>
    <div className="usage-foundation"><strong>{t("audits.telemetryTitle")}</strong><span>{t("audits.telemetryHint")}</span></div>
  </section>;
}
