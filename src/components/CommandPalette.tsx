"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MissionView } from "./MissionSidebar";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

type PaletteItem={id:string;label:string;meta:string;keywords:string;run:()=>void};

const send=sendOffice;

export function CommandPalette({onNavigate}:{onNavigate:(view:MissionView)=>void}){
  const {t}=useOfficeI18n();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const inputRef=useRef<HTMLInputElement|null>(null);
  const state=useActiveProjectState();
  const projects=useOfficeStore(s=>s.projects);
  const selectProject=useOfficeStore(s=>s.selectProject);
  const history=useOfficeStore(s=>s.commandHistory);

  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
        event.preventDefault();setOpen(current=>!current);
      }
      if(event.key==="Escape")setOpen(false);
    };
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key);
  },[]);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),0);else setQuery("");},[open]);
  useEffect(()=>{
    const navigate=(event:Event)=>{
      const action=String((event as CustomEvent).detail?.action||"");
      const views:MissionView[]=["office","workspace","collaboration","projects","agents","skills","tasks","inbox","findings","analytics","memory","release","settings"];
      if(views.includes(action as MissionView))onNavigate(action as MissionView);
    };
    window.addEventListener("office-command-palette",navigate);
    return()=>window.removeEventListener("office-command-palette",navigate);
  },[onNavigate]);

  const items=useMemo<PaletteItem[]>(()=>{
    const result:PaletteItem[]=[];
    const views:MissionView[]=["office","workspace","collaboration","projects","agents","skills","tasks","inbox","findings","analytics","memory","release","settings"];
    for(const view of views){
      const label=t(`nav.${view}`);
      const meta=t(`palette.meta.${view}`);
      result.push({id:`view-${view}`,label,meta,keywords:`navigate ${view} ${label} ${meta}`,run:()=>onNavigate(view)});
    }
    for(const project of projects.filter(x=>x.enabled))result.push({
      id:`project-${project.id}`,label:project.name,meta:t("palette.openProject"),keywords:`project ${project.name} ${project.path}`,
      run:()=>{selectProject(project.id);onNavigate("office");}
    });
    for(const command of ["status","review project","project coverage","validate"]){
      result.push({id:`command-${command}`,label:command,meta:t("palette.queueCmd"),keywords:`command ${command}`,run:()=>send({action:"queue_command",project_id:state.projectId,command})});
    }
    for(const task of history.filter(x=>x.projectId===state.projectId&&(x.workItemId||x.findingId)).slice(0,30)){
      result.push({
        id:`task-${task.id}`,label:task.workItemTitle||task.findingTitle||task.command,
        meta:`${task.status} · ${task.workItemId||task.findingId||task.id}`,keywords:`task ${task.workItemId} ${task.findingId} ${task.status} ${task.workItemTitle} ${task.findingTitle}`,
        run:()=>onNavigate("tasks")
      });
    }
    for(const agent of state.agents)result.push({id:`agent-${agent.id}`,label:agent.displayName||agent.role,meta:`${agent.role} · ${agent.status}`,keywords:`agent ${agent.id} ${agent.role} ${agent.status}`,run:()=>onNavigate("agents")});
    return result;
  },[history,onNavigate,projects,selectProject,state,t]);

  const visible=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return (q?items.filter(x=>`${x.label} ${x.meta} ${x.keywords}`.toLowerCase().includes(q)):items).slice(0,16);
  },[items,query]);

  if(!open)return <button className="command-palette-trigger" onClick={()=>setOpen(true)} title={t("palette.title")}>⌘K</button>;
  return <div className="command-palette-backdrop" onMouseDown={()=>setOpen(false)}>
    <section className="command-palette" onMouseDown={e=>e.stopPropagation()}>
      <div className="palette-search"><span>⌕</span><input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("palette.search")}/><kbd>ESC</kbd></div>
      <div className="palette-results">{visible.map(item=><button key={item.id} onClick={()=>{item.run();setOpen(false);}}><strong>{item.label}</strong><span>{item.meta}</span></button>)}{!visible.length?<p>{t("palette.empty")}</p>:null}</div>
      <footer>Ctrl+K · Read-only commands are safe to queue directly.</footer>
    </section>
  </div>;
}
