"use client";

import {useActiveProjectCoverage} from "@/hooks/useActiveProject";
import {hasProgressDoc,visibleStackDomains} from "@/coverage/visible-stack";
import {useOfficeI18n} from "@/i18n/officeI18n";

function domainLabel(t:(key:string,fallback?:string)=>string,domain:string){
  return t(`coverage.domain.${domain}`,domain.replace("-"," "));
}

export function ProjectProgressStrip(){
  const {t}=useOfficeI18n();
  const coverage=useActiveProjectCoverage();
  if(!hasProgressDoc(coverage))return null;
  const rows=visibleStackDomains(coverage);
  if(!rows.length)return null;
  return <section className="panel project-progress-strip" aria-label={t("progress.eyebrow")}>
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("progress.eyebrow")}</div>
        <h2>{t("coverage.overall").replace("{n}",String(coverage.overallScore))}</h2>
      </div>
      <span>{t("progress.hint")}</span>
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
