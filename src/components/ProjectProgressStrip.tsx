"use client";

import {useActiveProjectCoverage,useActiveProjectState,useActiveProjectWorkbench} from "@/hooks/useActiveProject";
import {hasProgressDoc,visibleStackDomains} from "@/coverage/visible-stack";
import {liveCompletion} from "@/coverage/live-completion";
import {useOfficeI18n} from "@/i18n/officeI18n";

function domainLabel(t:(key:string,fallback?:string)=>string,domain:string){
  return t(`coverage.domain.${domain}`,domain.replace("-"," "));
}

export function ProjectProgressStrip(){
  const {t}=useOfficeI18n();
  const coverage=useActiveProjectCoverage();
  const state=useActiveProjectState();
  const workbench=useActiveProjectWorkbench();
  if(!hasProgressDoc(coverage))return null;
  const rows=visibleStackDomains(coverage);
  if(!rows.length)return null;
  const live=liveCompletion({
    coverageScore:coverage.overallScore,
    roadmapPercent:state.roadmapPercent,
    remainingPercent:state.remainingPercent??coverage.remainingPercent,
    workTodo:workbench.summary.todo,
    workDone:workbench.summary.done,
    workFixing:workbench.summary.fixing
  });
  return <section className="panel project-progress-strip" aria-label={t("progress.eyebrow")}>
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("progress.eyebrow")}</div>
        <h2>{t("coverage.overall").replace("{n}",String(live.overallScore))}</h2>
      </div>
      <span>{t("progress.remaining").replace("{n}",String(live.remainingPercent))} · {t("progress.hint")}</span>
    </div>
    <div className="project-progress-grid">
      {rows.map(row=>(
        <article key={row.domain} className="project-progress-card">
          <strong>{domainLabel(t,row.domain)}</strong>
          <b>{row.score}%</b>
          <div className="coverage-bar"><i style={{width:`${row.score}%`}}/></div>
        </article>
      ))}
    </div>
  </section>;
}
