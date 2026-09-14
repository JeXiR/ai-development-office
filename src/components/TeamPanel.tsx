"use client";

import { useMemo, useState } from "react";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useLiveOfficeState } from "@/hooks/useLiveOfficeAgents";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
import type { OfficeAgent } from "@/types/office";

function AgentCard({
  agent,name,editing,onRename,statusLabel,noTask
}:{
  agent:OfficeAgent;name:string;editing:boolean;onRename:(id:string,value:string)=>void;statusLabel:string;noTask:string;
}){
  return (
    <article className={`roster-agent status-${agent.status} kind-${agent.kind||"core"}`}>
      <div className="mini-avatar">{name.slice(0,1).toUpperCase()}</div>
      <div className="roster-copy">
        <div className="roster-name-row">
          <strong>{name}</strong>
          <i className="status-light"/>
        </div>
        <span>{agent.role} · {statusLabel}</span>
        <small title={agent.task||noTask}>{agent.task||noTask}</small>
        {typeof agent.progressPercent==="number"?(
          <div className="agent-sprint-progress">
            <div><span>SPRINT</span><b>{agent.progressPercent}%</b></div>
            <i><em style={{width:`${agent.progressPercent}%`}}/></i>
            <small>{agent.sprintTotal?`${agent.sprintCompleted||0}/${agent.sprintTotal} completed${agent.queueCount?` · ${agent.queueCount} queued`:""}`:`${agent.progressPercent}%`}</small>
          </div>
        ):null}
        {agent.kind==="specialist"&&agent.capabilities?.length?(
          <div className="agent-capability-line">{agent.capabilities.slice(0,2).join(" · ")}</div>
        ):null}
        {editing&&(
          <input
            className="inline-agent-name"
            defaultValue={name}
            onBlur={e=>onRename(agent.id,e.target.value.trim()||agent.role)}
            onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}
          />
        )}
      </div>
    </article>
  );
}

export function TeamPanel(){
  const {t}=useOfficeI18n();
  const state=useLiveOfficeState();
  const allNames=useOfficeStore(s=>s.agentNames);
  const names=allNames[state.projectId]||{};
  const [editing,setEditing]=useState(false);

  const core=useMemo(()=>state.agents.filter(a=>(a.kind||"core")==="core"),[state.agents]);
  const specialists=useMemo(()=>state.agents.filter(a=>a.kind==="specialist"),[state.agents]);

  const rename=(agentId:string,value:string)=>{
    sendOffice({action:"rename_agent",project_id:state.projectId,agent_id:agentId,name:value});
  };

  return (
    <aside className="team-overview panel team-v11">
      <div className="team-title-row">
        <div>
          <div className="eyebrow">{t("team.eyebrow")}</div>
          <h2>{t("team.title")}</h2>
        </div>
        <button className="mini-btn" onClick={()=>setEditing(v=>!v)}>{editing?t("team.done"):t("team.editNames")}</button>
      </div>

      <div className="team-section-head">
        <strong>{t("org.core")}</strong><span>{t("team.coreHint").replace("{n}",String(core.length))}</span>
      </div>
      <div className="team-roster">
        {core.map(agent=><AgentCard key={agent.id} agent={agent} name={names[agent.id]||agent.role} editing={editing} onRename={rename} statusLabel={t(`office.${agent.status}`,agent.status)} noTask={t("team.noTask")}/>)}
      </div>

      <div className="team-section-head specialist-head">
        <strong>{t("org.specialists")}</strong><span>{t("team.specialistHint").replace("{n}",String(specialists.length))}</span>
      </div>
      <div className="team-roster specialist-roster">
        {specialists.length===0&&<div className="specialist-empty">{t("team.emptySpecialists")}</div>}
        {specialists.map(agent=><AgentCard key={agent.id} agent={agent} name={names[agent.id]||agent.role} editing={editing} onRename={rename} statusLabel={t(`office.${agent.status}`,agent.status)} noTask={t("team.noTask")}/>)}
      </div>
    </aside>
  );
}
