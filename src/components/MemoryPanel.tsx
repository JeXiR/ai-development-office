"use client";

import { useActiveFeatureContracts, useActiveProjectState, useActiveProjectWorkbench } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function MemoryPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const contracts=useActiveFeatureContracts();
  const wb=useActiveProjectWorkbench();
  const history=useOfficeStore(s=>s.commandHistory).filter(c=>c.projectId===state.projectId);
  const plans=history.filter(c=>c.planPath).slice(0,12);
  const projectName=!state.projectName||state.projectName==="No project selected"?t("switcher.none"):state.projectName;

  return <section className="memory-grid">
    <div className="panel memory-card"><div className="eyebrow">{t("mem.project")}</div><h2>{projectName}</h2><p>{state.activeTask||t("mem.noTask")}</p><code>{state.projectPath||"—"}</code></div>
    <div className="panel memory-card"><div className="eyebrow">{t("mem.contracts")}</div><h2>{contracts.contracts.length}</h2><p>{t("mem.openDecisions").replace("{n}",String(contracts.openQuestions))}</p></div>
    <div className="panel memory-card"><div className="eyebrow">{t("mem.history")}</div><h2>{wb.summary.done}</h2><p>{t("mem.historyMeta").replace("{todo}",String(wb.summary.todo)).replace("{fixing}",String(wb.summary.fixing)).replace("{deferred}",String(wb.summary.deferred))}</p></div>
    <div className="panel memory-plans"><div className="eyebrow">{t("mem.plans")}</div>{plans.length?plans.map(p=><div key={p.id}><strong>{p.workItemId||p.findingId||p.command}</strong><span>{p.planPath}</span></div>):<p className="muted">{t("mem.noPlans")}</p>}</div>
  </section>;
}
