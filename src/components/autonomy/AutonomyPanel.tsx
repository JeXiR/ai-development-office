"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useAutonomyStore} from "@/store/useAutonomyStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
const send=sendOffice;

export function AutonomyPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=useAutonomyStore();
  const [goal,setGoal]=useState("");
  const [task,setTask]=useState("");
  const [role,setRole]=useState("backend");

  useWhenOfficeConnected(()=>{if(projectId)send({action:"autonomy_scores",project_id:projectId});},[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("autonomy.eyebrow")}</div><h2>{t("autonomy.title")}</h2></div>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"autonomy_scores",project_id:projectId})}>{t("autonomy.refreshScores")}</button>
    </div>

    <div className="autonomy-compose">
      <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder={t("autonomy.goalPlaceholder")}/>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"autonomy_team_create",project_id:projectId,goal})}>{t("autonomy.buildTeam")}</button>
    </div>

    {state.team?<div className="team-grid">
      {state.team.roles.map(r=><article key={r.id}><strong>{r.title}</strong><small>{r.capabilities.join(" · ")}</small><span>{r.preferredProviders.join(" / ")}</span></article>)}
    </div>:null}

    <div className="route-compose">
      <input value={task} onChange={e=>setTask(e.target.value)} placeholder={t("autonomy.taskPlaceholder")}/>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder={t("autonomy.rolePlaceholder")}/>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"autonomy_route",project_id:projectId,task,role,preferred_providers:["codex","claude"],avoid_providers:[],min_trust:20,max_cost_usd:10})}>{t("autonomy.chooseProvider")}</button>
    </div>
    {state.route?<div className="route-result"><strong>{state.route.selected||t("common.none")}</strong><span>{state.route.reason}</span></div>:null}

    <div className="agent-score-grid">
      {state.scores.map(s=><article key={s.agentId}><strong>{s.agentId}</strong><small>{s.role}</small><span>{t("autonomy.qualityTrust").replace("{quality}",String(s.quality)).replace("{trust}",String(s.trust))}</span><em>{s.specialties.join(" · ")||t("autonomy.noSpecialties")}</em></article>)}
    </div>

    <div className="recovery-demo">
      <button onClick={()=>send({action:"autonomy_retry_strategy",attempt:2,max_attempts:4,repeated_errors:3,no_progress_count:1,current_provider:"codex",fallback_providers:["claude","cursor"],cost_exceeded:false,destructive_risk:false})}>{t("autonomy.retryDemo")}</button>
      <button onClick={()=>send({action:"autonomy_recovery",no_progress_count:4,repeated_command_count:2,repeated_error_count:1,cost_exceeded:false,runtime_exceeded:false,fallback_provider:"claude"})}>{t("autonomy.recoveryDemo")}</button>
      {state.retry?<span>{t("autonomy.retry")}: {state.retry.action} · {state.retry.reason}</span>:null}
      {state.recovery?<span>{t("autonomy.recovery")}: {state.recovery.action} · {state.recovery.reason}</span>:null}
    </div>
  </section>;
}