"use client";

import { useMemo } from "react";
import { useActiveAgentAnalytics, useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";

function trustScore(success:number|null,completed:number,failed:number,verified:number){
  if(success==null&&completed===0&&failed===0)return null;
  const successPart=success??50;
  const volume=Math.min(10,completed)*1.2;
  const verifiedBonus=Math.min(8,verified)*1.5;
  const failurePenalty=failed*5;
  return Math.max(0,Math.min(100,Math.round(successPart*.78+volume+verifiedBonus-failurePenalty)));
}

export function AgentTrustPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const analytics=useActiveAgentAnalytics();
  const history=useOfficeStore(s=>s.commandHistory);

  const rows=useMemo(()=>analytics.rows.map(row=>{
    const verified=history.filter(c=>c.projectId===state.projectId&&c.assignedRole===row.role&&c.qualityGateStatus==="verified").length;
    return {...row,verified,trust:trustScore(row.successRate,row.completed,row.failed,verified)};
  }),[analytics.rows,history,state.projectId]);

  return <section className="panel trust-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("trust.eyebrow")}</div><h2>{t("trust.title")}</h2></div></div>
    <div className="trust-list">
      {rows.length===0?<div className="muted">{t("trust.empty")}</div>:rows.map(row=><div className="trust-row" key={row.agentId}>
        <strong>{row.role}</strong><span>{t("trust.meta").replace("{done}",String(row.completed)).replace("{failed}",String(row.failed)).replace("{infra}",String(row.infrastructureBlocked??0)).replace("{verified}",String(row.verified))}</span>
        <div><i><b style={{width:`${row.trust??0}%`}}/></i><em>{row.trust==null?"—":row.trust}</em></div>
      </div>)}
    </div>
    <small className="trust-note">{t("trust.note")}</small>
  </section>;
}
