"use client";

import { useMemo } from "react";
import { useActiveProjectEvents, useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { needsInboxAttention } from "@/lib/inbox-attention";
import { useOfficeI18n } from "@/i18n/officeI18n";

type Notice={id:string;level:"critical"|"warning"|"success"|"info";title:string;body:string;time:string};

const NOTICE_TTL_MS=36*60*60*1000;
const INFRA_TTL_MS=2*60*60*1000;

function isFresh(time?:string|null,ttl=NOTICE_TTL_MS){
  const ts=Date.parse(String(time||""));
  return !Number.isFinite(ts)||Date.now()-ts<=ttl;
}

function isInfraNoise(text?:string|null){
  return /task_failed|resource_exhausted/i.test(String(text||""));
}

function isStaleVerdict(event:{event_type?:string;status?:string;message?:string|null;task?:string|null}){
  const body=`${event.message||""} ${event.task||""}`;
  return /VERDICT:\s*FAIL/i.test(body)||/Independent verifier blocked completion/i.test(body);
}

export function NotificationCenter(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const events=useActiveProjectEvents();
  const history=useOfficeStore(s=>s.commandHistory);
  const audit=useOfficeStore(s=>s.auditTrail);

  const notices=useMemo(()=>{
    const all:Notice[]=[];
    for(const event of events.slice(0,40)){
      if(event.project_id&&event.project_id!==state.projectId)continue;
      const ttl=isInfraNoise(`${event.event_type} ${event.message} ${event.task}`)?INFRA_TTL_MS:NOTICE_TTL_MS;
      if(!isFresh(event.timestamp,ttl)||isStaleVerdict(event))continue;
      const important=["error","blocked","decision_required","validation","task_completed"].includes(event.event_type)||["blocked","error"].includes(event.status);
      if(!important)continue;
      all.push({id:`e-${event.event_id}`,level:event.status==="error"?"critical":event.status==="blocked"?"warning":event.event_type==="task_completed"?"success":"info",title:`${event.actor.role} · ${event.event_type}`,body:event.message||event.task||"Office event",time:event.timestamp});
    }
    for(const command of history.filter(c=>c.projectId===state.projectId).slice(0,40)){
      if(!needsInboxAttention(command))continue;
      if(command.verifierStatus==="failed"||command.verifierStatus==="error")all.push({id:`v-${command.id}`,level:"critical",title:t("notify.verifier"),body:command.driftSummary||command.workItemTitle||command.command,time:command.completedAt||command.createdAt});
      else if(command.mergeGateStatus==="blocked")all.push({id:`m-${command.id}`,level:"warning",title:t("notify.merge"),body:command.mergeGateSummary||command.workItemTitle||command.command,time:command.completedAt||command.createdAt});
      else if(command.driftStatus==="detected")all.push({id:`d-${command.id}`,level:"warning",title:t("notify.drift"),body:command.driftSummary||command.workItemTitle||command.command,time:command.completedAt||command.createdAt});
    }
    for(const entry of audit.filter(x=>x.projectId===state.projectId).slice(0,25)){
      const ttl=isInfraNoise(`${entry.action} ${entry.message}`)?INFRA_TTL_MS:NOTICE_TTL_MS;
      if(!isFresh(entry.timestamp,ttl)||isStaleVerdict({message:entry.message}))continue;
      if(entry.outcome==="error"||entry.outcome==="blocked")all.push({id:`a-${entry.id}`,level:entry.outcome==="error"?"critical":"warning",title:`${entry.actor} · ${entry.action}`,body:entry.message,time:entry.timestamp});
    }
    return all.sort((a,b)=>b.time.localeCompare(a.time)).filter((x,i,arr)=>arr.findIndex(y=>y.title===x.title&&y.body===x.body)===i).slice(0,60);
  },[audit,events,history,state.projectId,t]);

  return <section className="panel notification-center">
    <div className="section-heading"><div><div className="eyebrow">{t("notify.eyebrow")}</div><h2>{t("notify.title")}</h2></div><span className="muted">{t("notify.recent").replace("{n}",String(notices.length))}</span></div>
    <div className="notification-list">{notices.map(n=><article className={`notice notice-${n.level}`} key={n.id}><i/><div><strong>{n.title}</strong><p>{n.body}</p></div><time>{new Date(n.time).toLocaleString()}</time></article>)}{!notices.length?<div className="inbox-empty"><b>✓</b><span>{t("notify.empty")}</span></div>:null}</div>
  </section>;
}
