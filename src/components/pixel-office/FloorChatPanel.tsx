"use client";
import {useEffect,useMemo,useRef} from "react";
import {useFloorChatStore} from "@/store/useFloorChatStore";
import {useOfficeI18n} from "@/i18n/officeI18n";
import type {FloorChatAgent} from "@/pixel-office-v2/floor-chat-types";

const KIND_TONE:Record<string,string>={
  finding:"tone-finding",
  work:"tone-work",
  event:"tone-event",
  command:"tone-command",
  gate:"tone-gate",
  doctor:"tone-doctor",
  recovery:"tone-recovery",
  coverage:"tone-coverage",
  progress:"tone-work",
  lesson:"tone-lesson"
};

function initials(value:string){
  const parts=String(value||"?").trim().split(/\s+/).slice(0,2);
  return parts.map(p=>p[0]?.toUpperCase()||"").join("")||"?";
}

export function FloorChatPanel(props:{agents:FloorChatAgent[];onAgentOpen?:(agentId:string)=>void}){
  const {t}=useOfficeI18n();
  const messages=useFloorChatStore(s=>s.messages);
  const paused=useFloorChatStore(s=>s.paused);
  const setPaused=useFloorChatStore(s=>s.setPaused);
  const scroller=useRef<HTMLDivElement|null>(null);
  const stick=useRef(true);

  const live=useMemo(()=>{
    const names=new Set(props.agents.map(a=>String(a.displayName||a.role||a.id)));
    return names.size;
  },[props.agents]);

  useEffect(()=>{
    const node=scroller.current;
    if(!node||!stick.current)return;
    node.scrollTop=node.scrollHeight;
  },[messages.length]);

  return <aside className="floor-chat-panel" aria-label={t("floorChat.title")}>
    <div className="floor-chat-head">
      <div>
        <div className="eyebrow">{t("floorChat.eyebrow")}</div>
        <h2>{t("floorChat.title")}</h2>
        <p>{t("floorChat.hint")}</p>
      </div>
      <div className="floor-chat-head-meta">
        <span>{t("floorChat.live").replace("{n}",String(live))}</span>
        <button type="button" className={paused?"is-paused":""} onClick={()=>setPaused(!paused)}>
          {paused?t("floorChat.resume"):t("floorChat.pause")}
        </button>
      </div>
    </div>
    {props.agents.length?<div className="floor-chat-roster">
      {props.agents.map(agent=>(
        <button
          type="button"
          key={agent.id}
          className="floor-chat-roster-btn"
          onClick={()=>props.onAgentOpen?.(agent.id)}
        >{agent.displayName||agent.role||agent.id}</button>
      ))}
    </div>:null}

    <div
      className="floor-chat-log"
      ref={scroller}
      onScroll={e=>{
        const el=e.currentTarget;
        stick.current=el.scrollHeight-el.scrollTop-el.clientHeight<48;
      }}
    >
      {!messages.length?<div className="floor-chat-empty">{t("floorChat.empty")}</div>:null}
      {messages.map(message=>(
        <article key={message.id} className={`floor-chat-line ${KIND_TONE[message.kind]||""}`}>
          <button type="button" className="floor-chat-avatar" aria-label={message.fromRole} onClick={()=>props.onAgentOpen?.(message.fromId)}>
            {initials(message.fromRole)}
          </button>
          <div>
            <header>
              <strong><button type="button" className="floor-chat-name" onClick={()=>props.onAgentOpen?.(message.fromId)}>{message.fromRole}</button></strong>
              <em>→ {message.toRole}</em>
              <time>{new Date(message.createdAt).toLocaleTimeString()}</time>
            </header>
            <p>{message.text.replace(/^[^:]+:\s*/,"")}</p>
          </div>
        </article>
      ))}
    </div>
  </aside>;
}
