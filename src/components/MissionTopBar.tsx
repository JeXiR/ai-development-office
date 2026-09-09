"use client";

import { useOfficeI18n } from "@/i18n/officeI18n";

import { useMemo } from "react";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { useActiveProjectQueue, useActiveProjectState, useActiveProjectWorkbench } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";

export function MissionTopBar(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const queue=useActiveProjectQueue();
  const wb=useActiveProjectWorkbench();
  const runner=useOfficeStore(s=>s.runnerStatus);
  const connected=useOfficeStore(s=>s.connected);
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const cachedName=projects.find(project=>project.id===activeProjectId)?.name||projects[0]?.name||"";
  const projectTitle=state.projectName&&state.projectName!=="No project selected"
    ?state.projectName
    :cachedName||(connected?t("switcher.none"):"…");
  const active=state.agents.filter(a=>["working","planning","reviewing","testing"].includes(a.status)).length;
  const open=state.findings.filter(f=>f.status==="open"||f.status==="working").length;
  const blocked=queue.filter(q=>q.blockedBy?.length).length;
  const parallel=runner?.parallel?.active??0;
  const parallelMax=runner?.parallel?.max??3;
  const officeStatus=!connected?t("disconnected"):blocked>0?t("attention_required"):t("all_systems_go");
  const officeClass=!connected?"offline":blocked>0?"attention":"online";

  return <header className="mission-topbar">
    <div className="mission-title"><div className="eyebrow">{t("office.title").toUpperCase()}</div><h1>{projectTitle}</h1><span>{state.milestone||t("topbar.missionControl")}</span></div>
    <div className="top-project"><span>{t("project").toUpperCase()}</span><ProjectSwitcher/></div>
    <div className="top-metrics">
      <div><span>{t("active_agents").toUpperCase()}</span><strong>{active}<small>/{state.agents.length}</small></strong></div>
      <div><span>{t("queued_tasks").toUpperCase()}</span><strong>{queue.length}</strong></div>
      <div><span>{t("open_findings").toUpperCase()}</span><strong>{open}</strong></div>
      <div><span>{t("blocked").toUpperCase()}</span><strong>{blocked}</strong></div>
      <div><span>{t("parallel").toUpperCase()}</span><strong>{parallel}<small>/{parallelMax}</small></strong></div>
    </div>
    <div className={`office-online ${officeClass}`}><i/><div><span>{t("office_status").toUpperCase()}</span><strong>{officeStatus}</strong></div></div>
  </header>;
}
