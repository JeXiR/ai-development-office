"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
import type { OfficeState } from "@/types/office";

function derivedRoadmap(state?:OfficeState){
  if(typeof state?.roadmapPercent==="number")return Math.max(0,Math.min(100,state.roadmapPercent));
  const findings=state?.findings||[];
  if(findings.length){
    const fixed=findings.filter(f=>f.status==="fixed").length;
    return Math.round(fixed/findings.length*100);
  }
  const counts=state?.counts;
  if(!counts)return 0;
  const total=counts.done+counts.partial+counts.todo;
  if(!total)return 0;
  return Math.round((counts.done+counts.partial*0.5)/total*100);
}

export function MultiProjectOverview(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const states=useOfficeStore(s=>s.states);
  const workbenches=useOfficeStore(s=>s.workbenches);
  const history=useOfficeStore(s=>s.commandHistory);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const selectProject=useOfficeStore(s=>s.selectProject);

  const rows=useMemo(()=>projects.filter(p=>p.enabled).map(project=>{
    const state=states[project.id];
    const wb=workbenches[project.id];
    const commands=history.filter(c=>c.projectId===project.id);
    const queue=commands.filter(c=>["queued","waiting_for_agent","planning","running","verifying"].includes(c.status));
    const activeAgents=state?.agents.filter(a=>["working","planning","reviewing","testing"].includes(a.status)).length??0;
    const openFindings=state?.findings.filter(f=>["open","working"].includes(f.status)).length??0;
    const blocked=queue.filter(c=>c.blockedBy?.length||c.status==="waiting_for_agent").length;
    const isolated=queue.filter(c=>(c.executionMode||"solo")!=="solo").length;
    const competitive=queue.filter(c=>c.executionMode==="competitive").length;
    const mergeWaiting=queue.filter(c=>c.mergeGateStatus==="pending"||c.mergeGateStatus==="passed").length;
    return {
      project,state,wb,queue:queue.length,activeAgents,openFindings,blocked,isolated,competitive,mergeWaiting,
      completed:wb?.summary.done??commands.filter(c=>c.status==="completed").length,
      ready:wb?.summary.todo??0,
    };
  }),[projects,states,workbenches,history]);

  const totals=useMemo(()=>rows.reduce((a,row)=>({
    agents:a.agents+row.activeAgents,queue:a.queue+row.queue,findings:a.findings+row.openFindings,blocked:a.blocked+row.blocked,
    isolated:a.isolated+row.isolated,competitive:a.competitive+row.competitive
  }),{agents:0,queue:0,findings:0,blocked:0,isolated:0,competitive:0}),[rows]);

  return <section className="portfolio-overview panel">
    <div className="portfolio-head">
      <div><div className="eyebrow">{t("portfolio.eyebrow")}</div><h2>{t("portfolio.title")}</h2></div>
      <div className="portfolio-totals">
        <span>{t("portfolio.projects").replace("{n}",String(rows.length))}</span>
        <span>{t("portfolio.activeAgents").replace("{n}",String(totals.agents))}</span>
        <span>{t("portfolio.queued").replace("{n}",String(totals.queue))}</span>
        <span>{t("portfolio.findings").replace("{n}",String(totals.findings))}</span>
        <span>{t("portfolio.blocked").replace("{n}",String(totals.blocked))}</span>
        <span>{t("portfolio.isolated").replace("{n}",String(totals.isolated))}</span>
        <span>{t("portfolio.competitive").replace("{n}",String(totals.competitive))}</span>
      </div>
    </div>
    <div className="portfolio-grid">
      {rows.map(row=><article className={`portfolio-card ${row.project.id===activeProjectId?"active":""}`} key={row.project.id}>
        <div className="portfolio-card-head">
          <div><i className={`health-${row.state?.health??"unknown"}`}/><strong>{row.state?.projectName||row.project.name}</strong><span>{row.state?.milestone||t("portfolio.noMilestone")}</span></div>
          <em>{row.project.provider||"auto"}</em>
        </div>
        <div className="portfolio-metrics">
          <div><b>{row.activeAgents}</b><span>{t("portfolio.agents")}</span></div><div><b>{row.queue}</b><span>{t("portfolio.queue")}</span></div>
          <div><b>{row.ready}</b><span>{t("portfolio.ready")}</span></div><div><b>{row.openFindings}</b><span>{t("office.kpis.findings")}</span></div>
          <div><b>{row.blocked}</b><span>{t("office.blocked")}</span></div><div><b>{row.completed}</b><span>{t("portfolio.done")}</span></div>
          <div><b>{row.isolated}</b><span>{t("portfolio.isolated").replace("{n}","").trim()}</span></div><div><b>{row.competitive}</b><span>{t("portfolio.race")}</span></div><div><b>{row.mergeWaiting}</b><span>{t("portfolio.merge")}</span></div>
        </div>
        <div className="portfolio-progress"><span>{t("portfolio.roadmap")}</span><i><b style={{width:`${derivedRoadmap(row.state)}%`}}/></i><em>{derivedRoadmap(row.state)}%</em></div>
        <code>{row.project.path}</code>
        <button disabled={row.project.id===activeProjectId} onClick={()=>selectProject(row.project.id)}>{row.project.id===activeProjectId?t("portfolio.current"):t("portfolio.open")}</button>
      </article>)}
    </div>
  </section>;
}
