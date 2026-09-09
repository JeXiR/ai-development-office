"use client";

import {useMemo,useState} from "react";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useMissionRunnerStore} from "@/mission-runner/store";
import {useProjectDocsStore} from "@/store/useProjectDocsStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function ProjectDocsIntelligencePanel(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const setGoal=useMissionRunnerStore(s=>s.setGoal);
  const snapshot=useProjectDocsStore(s=>activeProjectId?s.byProject[activeProjectId]||null:null);
  const busy=useProjectDocsStore(s=>s.busyProjectId===activeProjectId);
  const setBusy=useProjectDocsStore(s=>s.setBusy);
  const activeProject=useMemo(()=>projects.find((p:any)=>p.id===activeProjectId)||null,[projects,activeProjectId]);
  const [brief,setBrief]=useState("");

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  const inspect=()=>{
    if(!activeProject)return;
    setBusy(activeProject.id);
    send("inspect_project_docs",{projectPath:activeProject.path});
  };

  useWhenOfficeConnected(()=>{
    if(!activeProject)return;
    inspect();
  },[activeProject?.id]);

  const bootstrap=()=>{
    if(!activeProject||!brief.trim())return;
    setBusy(activeProject.id);
    send("bootstrap_project_docs",{
      projectPath:activeProject.path,
      projectName:activeProject.name,
      brief:brief.trim()
    });
  };

  const status=(file:string|null|undefined)=>{
    if(busy&&!snapshot)return t("docs.scanning");
    if(!snapshot)return "—";
    return file?t("docs.found"):t("docs.missing");
  };

  return <section className="panel project-docs-intelligence" data-help="project-docs-intelligence">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("docs.eyebrow")}</div>
        <h2>{t("docs.title")}</h2>
      </div>
      <span>{t("docs.missions").replace("{n}",String(snapshot?.missionCandidates?.length??0))}</span>
    </div>

    <div className="project-docs-grid">
      <div>
        <strong>{t("docs.existing")}</strong>
        <small>{t("docs.existingHint")}</small>
        <div className="skills-toolbar">
          <button onClick={inspect} disabled={!activeProject||busy}>{busy?t("docs.scanning"):t("docs.scan")}</button>
          <button onClick={()=>snapshot?.nextMission&&setGoal(snapshot.nextMission.title)} disabled={!snapshot?.nextMission}>{t("docs.useNext")}</button>
        </div>
        <div className="project-docs-summary">
          <span>{t("docs.roadmap")}: {status(snapshot?.snapshot?.roadmapFile)}</span>
          <span>{t("docs.progress")}: {status(snapshot?.snapshot?.progressFile)}</span>
          <span>{t("docs.state")}: {status(snapshot?.snapshot?.stateFile)}</span>
        </div>
      </div>

      <div>
        <strong>{t("docs.create")}</strong>
        <small>{t("docs.createHint")}</small>
        <textarea rows={4} value={brief} onChange={e=>setBrief(e.target.value)} placeholder={t("docs.placeholder")}/>
        <button onClick={bootstrap} disabled={!activeProject||!brief.trim()||busy}>{t("docs.createButton")}</button>
      </div>
    </div>

    <div className="mission-history-list">
      {(snapshot?.missionCandidates||[]).slice(0,12).map((task:any)=><article key={task.id}>
        <div><strong>{task.title}</strong><span>{task.status}</span></div>
        <small>{task.sourceFile}{task.sourceLine?`:${task.sourceLine}`:""}</small>
        <div className="skills-toolbar">
          <button onClick={()=>setGoal(task.title)}>{t("docs.sendMission")}</button>
        </div>
      </article>)}
      {!snapshot?.missionCandidates?.length?<p className="muted">{t("docs.noMissions")}</p>:null}
    </div>
  </section>;
}
