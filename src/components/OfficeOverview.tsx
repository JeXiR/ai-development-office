"use client";

import { PixelOfficeRuntime } from "./pixel-office/PixelOfficeRuntime";
import { LiveTaskStrip } from "./pixel-office/LiveTaskStrip";
import { ProjectProgressStrip } from "./ProjectProgressStrip";
import { AgentSquadStrip } from "./AgentSquadStrip";
import { DecisionCenter } from "./DecisionCenter";
import { useActiveProjectQueue, useActiveProjectWorkbench } from "@/hooks/useActiveProject";
import { useLiveOfficeState } from "@/hooks/useLiveOfficeAgents";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function OfficeOverview(){
  const {t}=useOfficeI18n();
  const state=useLiveOfficeState();
  const queue=useActiveProjectQueue();
  const wb=useActiveProjectWorkbench();
  const active=state.activeCount;
  return <>
    <PixelOfficeRuntime/>
    <ProjectProgressStrip/>
    <LiveTaskStrip/>
    <section className="office-kpis">
      <div><span>{t("office.kpis.activeAgents")}</span><strong>{active}</strong><small>{t("office.kpis.total").replace("{n}",String(state.agents.length))}</small></div>
      <div><span>{t("office.kpis.readyWork")}</span><strong>{wb.summary.todo}</strong><small>{t("office.kpis.inProgress").replace("{n}",String(wb.summary.fixing))}</small></div>
      <div><span>{t("office.kpis.queue")}</span><strong>{queue.length}</strong><small>{t("office.kpis.blocked").replace("{n}",String(queue.filter(q=>q.blockedBy?.length).length))}</small></div>
      <div><span>{t("office.kpis.completed")}</span><strong>{wb.summary.done}</strong><small>{t("office.kpis.verified")}</small></div>
      <div><span>{t("office.kpis.findings")}</span><strong>{state.findings.filter(f=>f.status==="open"||f.status==="working").length}</strong><small>{t("office.kpis.fixed").replace("{n}",String(state.findings.filter(f=>f.status==="fixed").length))}</small></div>
    </section>
    <AgentSquadStrip/>
    <DecisionCenter/>
  </>;
}
