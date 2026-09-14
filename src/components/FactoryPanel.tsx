"use client";

import {useEffect, useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useFactoryStore} from "@/store/useFactoryStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {emptyFactoryState} from "@/factory/autonomous-factory";
import {useCoordinationStore} from "@/store/useCoordinationStore";
import type {OfficeCommandRequest} from "@/types/command";

function statusTone(status:string){
  if(status==="running")return "run";
  if(status==="tripped")return "trip";
  if(status==="completed")return "done";
  if(status==="needs_trust")return "trust";
  return "idle";
}

function itemLabel(row:OfficeCommandRequest){
  return row.workItemTitle||row.findingTitle||row.command;
}

function FactoryLane({title, rows, empty}:{title:string;rows:OfficeCommandRequest[];empty:string}){
  const {t}=useOfficeI18n();
  return <article className="factory-tray">
    <header>
      <strong>{title}</strong>
      <b>{rows.length}</b>
    </header>
    {rows.slice(0,6).map(row=><div className="factory-item" key={row.id}>
      <code>{row.workItemId||row.findingId||row.command}</code>
      <span>{itemLabel(row)}</span>
      {row.assignedRole||row.leadRole?<em>{row.assignedRole||row.leadRole}</em>:null}
      {row.mergeMethod&&row.mergeMethod!=="none"?<i className={`chip chip-${row.mergeMethod}`}>{t(row.mergeMethod==="patch"?"coord.patch":"coord.squash")}</i>:null}
    </div>)}
    {!rows.length?<p className="muted">{empty}</p>:null}
  </article>;
}

export function FactoryPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const project=useOfficeStore(s=>s.projects.find(p=>p.id===s.activeProjectId)||null);
  const history=useOfficeStore(s=>s.commandHistory);
  const leases=useCoordinationStore(s=>s.leases);
  const receipts=useCoordinationStore(s=>s.receipts);
  const templates=useCoordinationStore(s=>s.templates);
  const snapshot=useFactoryStore(s=>projectId?s.byProject[projectId]:null);
  const state=snapshot?.state||emptyFactoryState(projectId||"none");
  const settings=snapshot?.settings;
  const [command,setCommand]=useState(snapshot?.customCli.command||"");
  const [args,setArgs]=useState((snapshot?.customCli.args||["{prompt}"]).join(" "));

  useEffect(()=>{
    if(projectId){
      sendOffice({action:"factory_status", project_id:projectId});
      sendOffice({action:"coordination_snapshot", project_id:projectId});
    }
  },[projectId]);

  useEffect(()=>{
    setCommand(snapshot?.customCli.command||"");
    setArgs((snapshot?.customCli.args||["{prompt}"]).join(" "));
  },[snapshot?.customCli.command, snapshot?.customCli.args]);

  if(!projectId||!project)return null;
  const running=state.status==="running";
  const mine=history.filter(x=>x.projectId===projectId);
  const queued=mine.filter(x=>["queued","waiting_for_agent","planning"].includes(x.status));
  const active=mine.filter(x=>["running","plan_ready"].includes(x.status));
  const review=mine.filter(x=>x.status==="verifying"||receipts.some(r=>r.itemId===(x.workItemId||x.findingId||x.id)&&!r.ok));
  const liveItem=mine.find(x=>["running","planning","plan_ready","verifying","waiting_for_agent"].includes(x.status));
  const liveBusy=!!liveItem;
  const displayRunning=running||liveBusy;
  const statusKey=state.status==="needs_trust"?"needsTrust":state.status==="tripped"?"tripped":displayRunning?"running":state.status==="completed"?"completed":"idle";
  const empty=t("coord.laneEmpty");
  const banner=liveItem?(liveItem.message||itemLabel(liveItem)):state.lastMessage;

  return <section className="panel factory-panel">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("factory.eyebrow")}</div>
        <h2>{t("factory.title")}</h2>
        <p className="muted">{t("factory.hint")}</p>
      </div>
      <em className={`factory-status is-${statusTone(displayRunning?"running":state.status)}`}>{t(`factory.${statusKey}`)}</em>
    </div>
    <p className="factory-message">{banner}</p>
    {state.tripReason?<small className="work-recheck-warning">{state.tripReason}</small>:null}
    {!project.runnerTrusted?<small className="work-recheck-warning">{t("factory.needsTrust")}</small>:null}
    <div className="factory-stats">
      <span>{t("factory.queued").replace("{n}", String(state.queuedIds.length))}</span>
      <span>{t("factory.doneCount").replace("{n}", String(state.completedIds.length))}</span>
      <span>{t("coord.leases")} {leases.length}</span>
      <span>{state.hiveEnabled?t("factory.hiveOn"):t("factory.hiveOff")}</span>
    </div>
    <div className="factory-lanes">
      <FactoryLane title={t("coord.laneQueued")} rows={queued} empty={empty}/>
      <FactoryLane title={t("coord.laneActive")} rows={active} empty={empty}/>
      <FactoryLane title={t("coord.laneReview")} rows={review} empty={empty}/>
    </div>
    <div className="factory-actions">
      <button className="primary-btn" disabled={displayRunning||!project.runnerTrusted} onClick={()=>sendOffice({action:"factory_start", project_id:projectId})}>{t("factory.start")}</button>
      <button disabled={!running} onClick={()=>sendOffice({action:"factory_stop", project_id:projectId})}>{t("factory.stop")}</button>
      <label className="factory-check">
        <input type="checkbox" checked={state.hiveEnabled} onChange={e=>sendOffice({action:"set_factory_settings", project_id:projectId, hive_enabled:e.target.checked})}/>
        {t("factory.hiveOn")}
      </label>
      <label className="factory-template">
        {t("factory.template")}
        <select value={settings?.groupTemplateId||""} onChange={e=>sendOffice({action:"set_factory_settings", project_id:projectId, group_template_id:e.target.value||null})}>
          <option value="">{t("common.none")}</option>
          {templates.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
    </div>
    <div className="factory-budget">
      <span>{t("factory.budget")}</span>
      <small>{settings?`${settings.ceilings.maxTokens} ${t("factory.tokens")} · $${settings.ceilings.maxCostUsd} ${t("factory.cost")} · ${settings.ceilings.maxRuntimeMinutes} ${t("factory.minutes")}`:"—"}</small>
    </div>
    <div className="factory-custom">
      <span>{t("factory.customCli")}</span>
      <small className="muted">{t("factory.customHint")}</small>
      <input value={command} onChange={e=>setCommand(e.target.value)} placeholder="my-agent"/>
      <input value={args} onChange={e=>setArgs(e.target.value)} placeholder="--cwd {project} {prompt}"/>
      <button onClick={()=>sendOffice({action:"set_custom_cli", project_id:projectId, command, args:args.split(/\s+/).filter(Boolean)})}>{t("factory.saveCli")}</button>
    </div>
  </section>;
}
