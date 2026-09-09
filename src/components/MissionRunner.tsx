"use client";

import {useMemo,useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useMissionRunnerStore} from "@/mission-runner/store";
import {useOfficeI18n} from "@/i18n/officeI18n";

const PHASES=["planning","approval","running","testing","reviewing","completed"] as const;

export function MissionRunner(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const states=useOfficeStore(s=>s.states);
  const agents=activeProjectId?states[activeProjectId]?.agents??[]:[];

  const goal=useMissionRunnerStore(s=>s.goal);
  const phase=useMissionRunnerStore(s=>s.phase);
  const missionId=useMissionRunnerStore(s=>s.missionId);
  const events=useMissionRunnerStore(s=>s.events);
  const result=useMissionRunnerStore(s=>s.result);
  const approval=useMissionRunnerStore(s=>s.approval);
  const evidence=useMissionRunnerStore(s=>s.evidence);
  const replay=useMissionRunnerStore(s=>s.replay);
  const setGoal=useMissionRunnerStore(s=>s.setGoal);
  const setEvidence=useMissionRunnerStore(s=>s.setEvidence);
  const setReplay=useMissionRunnerStore(s=>s.setReplay);
  const reset=useMissionRunnerStore(s=>s.reset);
  const busy=useMissionRunnerStore(s=>s.busy);
  const setBusy=useMissionRunnerStore(s=>s.setBusy);

  const [tab,setTab]=useState<"result"|"evidence"|"replay">("result");
  const [realProjectMode,setRealProjectMode]=useState(false);
  const [realExecution,setRealExecution]=useState<any>(null);

  const activeProject=useMemo(()=>projects.find((p:any)=>p.id===activeProjectId)||null,[projects,activeProjectId]);

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="autonomous_mission_result"&&m.data?.missionId){
          send("get_mission_evidence_item",{missionId:m.data.missionId});
          send("get_mission_replay",{missionId:m.data.missionId});
        }
        if(m.type==="mission_evidence_item")setEvidence(m.data);
        if(m.type==="mission_replay")setReplay(m.data);
        if(m.type==="real_project_execution")setRealExecution(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    return()=>socket.removeEventListener("message",onMessage);
  },[setEvidence,setReplay]);

  const startMission=(approved=false)=>{
    if(!activeProject||!goal.trim()||busy)return;
    setBusy(true);

    if(realProjectMode){
      send("execute_real_project_mission",{
        projectId:activeProject.id,
        projectPath:activeProject.path,
        goal:goal.trim(),
        keepWorkspace:false
      });
      return;
    }

    send("execute_autonomous_mission",{
      projectId:activeProject.id,
      projectPath:activeProject.path,
      goal:goal.trim(),
      agents,
      approved
    });
  };

  const cancel=()=>{
    if(missionId)send("cancel_autonomous_mission",{missionId});
  };

  const approveAndResume=()=>{
    if(!approval)return;
    startMission(true);
  };

  const phaseIndex=PHASES.indexOf(phase as any);

  return <section className="mission-runner panel" data-help="mission-runner">
    <div className="mission-runner-hero">
      <div>
        <div className="eyebrow">{t("mission.eyebrow")}</div>
        <h1>{t("mission.title")}</h1>
        <p>{activeProject?t("mission.activeProject").replace("{name}",activeProject.name):t("mission.chooseProject")}</p>
      </div>
      <span className={`mission-phase phase-${phase}`}>{phase.toUpperCase()}</span>
    </div>

    <textarea
      className="mission-goal-input"
      value={goal}
      onChange={e=>setGoal(e.target.value)}
      placeholder={t("mission.placeholder")}
      rows={5}
      disabled={busy}
    />

    <div className="mission-mode-row">
      <label><input type="checkbox" checked={realProjectMode} onChange={e=>setRealProjectMode(e.target.checked)}/> {t("mission.realMode")}</label>
      <small>{realProjectMode?t("mission.realModeHint"):t("mission.planModeHint")}</small>
    </div>

    <div className="mission-runner-actions">
      <button className="primary" onClick={()=>startMission(false)} disabled={!activeProject||!goal.trim()||busy}>
        {busy?t("mission.running"):t("mission.start")}
      </button>
      <button onClick={cancel} disabled={!busy}>{t("common.cancel")}</button>
      <button onClick={reset} disabled={busy}>{t("mission.new")}</button>
    </div>

    <div className="mission-phase-track">
      {PHASES.map((p,index)=><div key={p} className={index<=phaseIndex?"done":""}>
        <span>{index+1}</span>
        <b>{p}</b>
      </div>)}
    </div>

    {phase==="approval"&&approval?<div className="mission-approval-card">
      <strong>{t("mission.approvalRequired")}</strong>
      <p>{t("mission.riskDetected").replace("{risk}",approval.approval?.risk||approval.risk||"guarded")}</p>
      <small>{(approval.approval?.reasons||approval.reasons||[]).join(" · ")}</small>
      <div className="skills-toolbar">
        <button className="primary" onClick={approveAndResume}>{t("mission.approveContinue")}</button>
        <button onClick={()=>{setBusy(false);reset();}}>{t("common.reject")}</button>
      </div>
    </div>:null}

    <div className="mission-live-grid">
      <div className="mission-live-events">
        <div className="section-heading">
          <div><div className="eyebrow">{t("mission.liveProgress")}</div><h2>{t("mission.activity")}</h2></div>
          <span>{events.length} events</span>
        </div>
        <div className="mission-event-list">
          {events.length?events.slice().reverse().map((e,i)=><div key={`${e.at}-${i}`}>
            <span>{e.at.split("T")[1]?.replace("Z","").slice(0,8)||""}</span>
            <b>{e.phase}</b>
            <small>{e.agentId?`${e.agentId}${e.providerId?` · ${e.providerId}`:""}`:e.message}</small>
          </div>):<p className="muted">{t("mission.noEvents")}</p>}
        </div>
      </div>

      <div className="mission-result-pane">
        <div className="mission-result-tabs">
          <button onClick={()=>setTab("result")} className={tab==="result"?"active":""}>{t("mission.result")}</button>
          <button onClick={()=>setTab("evidence")} className={tab==="evidence"?"active":""}>{t("mission.evidence")}</button>
          <button onClick={()=>setTab("replay")} className={tab==="replay"?"active":""}>{t("mission.replay")}</button>
        </div>

        {tab==="result"?<pre>{realExecution?JSON.stringify({
          workspaceMode:realExecution.workspaceMode,
          changed:realExecution.changed,
          verification:realExecution.verification,
          gitStatus:realExecution.gitStatus,
          gitDiff:realExecution.gitDiff,
          testEvidence:realExecution.testEvidence
        },null,2):result?JSON.stringify(result.finalResult??result,null,2):t("mission.noResult")}</pre>:null}
        {tab==="evidence"?<pre>{evidence?JSON.stringify(evidence,null,2):t("mission.noEvidence")}</pre>:null}
        {tab==="replay"?<pre>{replay?JSON.stringify(replay,null,2):t("mission.noReplay")}</pre>:null}
      </div>
    </div>
  </section>;
}
