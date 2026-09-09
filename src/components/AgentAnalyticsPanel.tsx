"use client";

import { useActiveAgentAnalytics } from "@/hooks/useActiveProject";
import { useOfficeI18n } from "@/i18n/officeI18n";

function duration(seconds:number|null){
  if(seconds==null)return "—";
  if(seconds<60)return `${seconds}s`;
  if(seconds<3600)return `${Math.round(seconds/60)}m`;
  return `${(seconds/3600).toFixed(1)}h`;
}

export function AgentAnalyticsPanel(){
  const {t}=useOfficeI18n();
  const analytics=useActiveAgentAnalytics();
  if(!analytics.rows.length){
    return <section className="panel agent-analytics-panel">
      <div className="analytics-head"><div><div className="eyebrow">{t("analytics.eyebrow")}</div><h2>{t("analytics.title")}</h2></div></div>
      <p className="muted">{t("analytics.empty")}</p>
    </section>;
  }

  return (
    <section className="panel agent-analytics-panel">
      <div className="analytics-head">
        <div><div className="eyebrow">{t("analytics.eyebrow")}</div><h2>{t("analytics.title")}</h2></div>
        <div className="analytics-summary">
          <span>{t("analytics.completed").replace("{n}",String(analytics.totalCompleted))}</span>
          <span>{t("analytics.failed").replace("{n}",String(analytics.totalFailed))}</span>
          <span>{t("analytics.infra").replace("{n}",String(analytics.totalInfrastructureBlocked??0))}</span>
          <span>{t("analytics.peak").replace("{n}",String(analytics.parallelPeak))}</span>
        </div>
      </div>
      <div className="analytics-table">
        <div className="analytics-row analytics-header">
          <span>{t("analytics.colAgent")}</span><span>{t("analytics.colAssigned")}</span><span>{t("analytics.colDone")}</span><span>{t("analytics.colFailed")}</span><span>{t("analytics.colInfra")}</span><span>{t("analytics.colQueued")}</span><span>{t("analytics.colSuccess")}</span><span>{t("analytics.colAvg")}</span>
        </div>
        {analytics.rows.slice(0,14).map(row=>(
          <div className="analytics-row" key={row.agentId}>
            <strong>{row.role}</strong>
            <span>{row.assigned}</span>
            <span>{row.completed}</span>
            <span>{row.failed}</span>
            <span>{row.infrastructureBlocked??0}</span>
            <span>{row.queued}</span>
            <span>{row.successRate==null?"—":`${row.successRate}%`}</span>
            <span>{duration(row.avgDurationSeconds)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
