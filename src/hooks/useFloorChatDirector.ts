"use client";
import {useEffect,useRef} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useFloorChatStore} from "@/store/useFloorChatStore";
import {usePixelOfficeLiveStore} from "@/pixel-office-v2/live-store";
import {collectFloorTopics,collectLessons,nextFloorExchange} from "@/pixel-office-v2/floor-chat-engine";
import type {FloorChatAgent,FloorChatLang} from "@/pixel-office-v2/floor-chat-types";
import {useActiveProjectEvents,useActiveProjectState,useActiveProjectWorkbench} from "@/hooks/useActiveProject";

export function useFloorChatDirector(agents:FloorChatAgent[],lang:FloorChatLang){
  const project=useActiveProjectState();
  const events=useActiveProjectEvents();
  const workbench=useActiveProjectWorkbench();
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const projectName=useOfficeStore(s=>s.projects.find(p=>p.id===s.activeProjectId)?.name||project.projectName);
  const commandHistory=useOfficeStore(s=>s.commandHistory);
  const recovery=useOfficeStore(s=>s.recovery);
  const gate=useOfficeStore(s=>s.releaseGates[activeProjectId||""]);
  const doctor=useOfficeStore(s=>s.doctorByProject[activeProjectId||""]);
  const hydrate=useFloorChatStore(s=>s.hydrate);
  const append=useFloorChatStore(s=>s.append);
  const paused=useFloorChatStore(s=>s.paused);
  const tickRef=useRef(0);
  const signatureRef=useRef("");

  useEffect(()=>{
    if(activeProjectId)hydrate(activeProjectId,lang);
  },[activeProjectId,lang,hydrate]);

  useEffect(()=>{
    if(paused||!activeProjectId)return;

    const run=(force:boolean)=>{
      const store=useFloorChatStore.getState();
      if(store.paused)return;
      const roster=agents.length>=2?agents:[
        {id:"ceo",role:"CEO",displayName:"CEO"},
        {id:"qa",role:"QA",displayName:"QA"},
        {id:"architect",role:"Architect",displayName:"Architect"}
      ];
      const topics=collectFloorTopics({
        findings:project.findings||[],
        workItems:workbench.workItems||[],
        events:events||[],
        commands:(commandHistory||[]).filter(c=>c.projectId===activeProjectId).slice(0,24),
        gate,
        doctor,
        recovery,
        coverage:workbench.frontendCoverage||[],
        project:{
          name:projectName,
          health:project.health,
          milestone:project.milestone,
          activeTask:project.activeTask,
          counts:project.counts
        }
      });
      const lessons=collectLessons(
        store.memory,
        [
          ...(project.findings||[]).map(f=>({id:`finding:${f.id}`,status:f.status,title:f.title})),
          ...(workbench.workItems||[]).map(w=>({id:`work:${w.id}`,status:w.status,title:w.title}))
        ]
      );
      const exchange=nextFloorExchange({
        projectId:activeProjectId,
        lang,
        agents:roster,
        topics:[...lessons,...topics],
        memory:store.memory
      });
      if(!exchange)return;
      if(!force&&Date.now()-tickRef.current<14000)return;
      tickRef.current=Date.now();
      append(exchange.messages,exchange.memory);
      const last=exchange.messages[exchange.messages.length-1];
      if(last){
        usePixelOfficeLiveStore.getState().sendAgentMessage(last.fromId,last.toId,last.text.replace(/^[^:]+:\s*/,"").slice(0,72));
      }
    };

    const signature=[
      activeProjectId,projectName,
      (project.findings||[]).map(f=>`${f.id}:${f.status}`).join("|"),
      (workbench.workItems||[]).slice(0,12).map(w=>`${w.id}:${w.status}`).join("|"),
      (events||[]).slice(-4).map(e=>e.event_id).join("|"),
      (commandHistory||[]).filter(c=>c.projectId===activeProjectId).slice(0,8).map(c=>`${c.id}:${c.status}`).join("|"),
      lang,
      gate?.ready?"g1":"g0",
      doctor?.overall||"",
      String(recovery?.interrupted?.length||0)
    ].join("::");

    const changed=signature!==signatureRef.current;
    signatureRef.current=signature;
    const kick=window.setTimeout(()=>run(changed),changed?1600:9000);
    const pulse=window.setInterval(()=>run(false),22000);
    return()=>{
      window.clearTimeout(kick);
      window.clearInterval(pulse);
    };
  },[
    paused,activeProjectId,projectName,project.findings,project.health,project.milestone,project.activeTask,project.counts,
    workbench.workItems,workbench.frontendCoverage,events,commandHistory,recovery,gate,doctor,agents,lang,append
  ]);
}
