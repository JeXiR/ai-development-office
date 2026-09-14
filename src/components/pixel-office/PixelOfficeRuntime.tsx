"use client";
import {useEffect,useMemo,useState} from "react";
import {usePixelOfficeStore} from "@/store/usePixelOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {useActiveProjectState} from "@/hooks/useActiveProject";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {TerminalModal} from "./TerminalModal";
import {AgentDeskModal} from "./AgentDeskModal";
import {PixelOfficeV2Canvas} from "./PixelOfficeV2Canvas";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useMissionRunnerStore} from "@/mission-runner/store";
import {FloorChatPanel} from "./FloorChatPanel";
import {roleToStation} from "@/pixel-office-v2/runtime-map";
import {usePixelOfficeLiveStore} from "@/pixel-office-v2/live-store";
import {isPixelActive,lookupLiveAgent} from "@/pixel-office-v2/agent-match";
import {defaultFloorRoster,rosterKeyOf} from "@/pixel-office-v2/default-roster";
import {useFloorChatDirector} from "@/hooks/useFloorChatDirector";
import {useAgentDeskStore} from "@/store/useAgentDeskStore";

export function PixelOfficeRuntime(){
  const {t,language}=useOfficeI18n();
  const snapshot=usePixelOfficeStore(s=>s.snapshot);
  const projectState=useActiveProjectState();
  const sessions=useWorkspaceStore(s=>s.runtimeSessions);
  const selectRuntime=useWorkspaceStore(s=>s.selectRuntimeSession);
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const setGoal=useMissionRunnerStore(s=>s.setGoal);
  const [terminalOpen,setTerminalOpen]=useState(false);
  const deskAgentId=useAgentDeskStore(s=>s.deskAgentId);
  const openDesk=useAgentDeskStore(s=>s.open);
  const closeDesk=useAgentDeskStore(s=>s.close);
  const liveAgents=usePixelOfficeLiveStore(s=>s.liveAgents);
  const messages=usePixelOfficeLiveStore(s=>s.messages);
  const seedAgents=usePixelOfficeLiveStore(s=>s.seedAgents);
  const pruneMessages=usePixelOfficeLiveStore(s=>s.pruneMessages);
  const officeTheme=useOfficeStore(s=>s.missionSettings.officeTheme);

  useEffect(()=>{
    const timer=window.setInterval(()=>pruneMessages(),500);
    return()=>window.clearInterval(timer);
  },[pruneMessages]);

  const displayAgents=useMemo(()=>{
    const merged=[...defaultFloorRoster()];
    const seen=new Set(merged.map(a=>rosterKeyOf(a.id,a.role)));

    const absorb=(id:string,role:string,extra:Partial<(typeof merged)[number]>= {})=>{
      const key=rosterKeyOf(id,role);
      if(!key)return;
      const next={
        id,
        role:role||id,
        provider:"auto" as const,
        state:"idle" as const,
        station:roleToStation(role||id) as any,
        targetStation:null,
        speech:null,
        taskLabel:null,
        progress:null,
        lastEventAt:new Date(0).toISOString(),
        ...extra
      } as any;
      const idx=merged.findIndex(a=>rosterKeyOf(a.id,a.role)===key);
      if(idx>=0){
        merged[idx]={...merged[idx],...next,station:next.station||merged[idx].station};
        return;
      }
      seen.add(key);
      merged.push(next);
    };

    for(const agent of snapshot.agents)absorb(agent.id,agent.role,agent as any);
    for(const base of projectState.agents)absorb(base.id||base.role,base.role||base.displayName||base.id||"agent");
    return merged.map(agent=>{
      const live=lookupLiveAgent({id:agent.id,role:agent.role},liveAgents);
      const home=roleToStation(agent.role||agent.id||"agent") as any;
      const station=live&&isPixelActive(live.state)?live.station as any:home;
      return live?{
        ...agent,
        state:live.state as any,
        station,
        targetStation:station,
        speech:live.speech,
        progress:live.progress
      }:{...agent,station:home,targetStation:null};
    });
  },[snapshot.agents,projectState.agents,liveAgents]);

  useEffect(()=>{
    seedAgents(displayAgents.map((a:any)=>({
      id:a.id,
      role:a.role||a.id,
      state:a.state,
      station:(a.station==="mailbox"?"lounge":a.station) as any
    })));
  },[displayAgents,seedAgents]);

  const rosterKey=displayAgents.map(agent=>`${agent.id}:${agent.role}`).join("|");
  const chatAgents=useMemo(()=>displayAgents.map(agent=>({
    id:agent.id,
    role:String(agent.role||agent.id),
    displayName:String(agent.role||agent.id)
  })),[rosterKey]);
  useFloorChatDirector(chatAgents,language==="de"||language==="ru"||language==="tr"?language:"en");

  const activeCount=displayAgents.filter(a=>isPixelActive(a.state)).length;

  const deskAgent=displayAgents.find(agent=>agent.id===deskAgentId)
    ||displayAgents.find(agent=>rosterKeyOf(agent.id,agent.role)===String(deskAgentId||"").toLowerCase())
    ||displayAgents.find(agent=>String(agent.role||"").toLowerCase()===String(deskAgentId||"").toLowerCase())
    ||null;
  const deskSession=deskAgent
    ?sessions.find(s=>s.agentId===deskAgent.id&&s.status==="running")||sessions.find(s=>s.agentId===deskAgent.id)||null
    :null;
  const activeProject=projects.find(project=>project.id===activeProjectId)||null;

  const openAgentDesk=(agentId:string)=>{
    openDesk(agentId);
    const session=sessions.find(s=>s.agentId===agentId&&s.status==="running")||sessions.find(s=>s.agentId===agentId);
    if(session)selectRuntime(session.id);
  };

  const assignDeskTask=(goal:string)=>{
    if(!deskAgent||!activeProject)return;
    const reportedBy=deskAgent.role||deskAgent.id;
    const reporterId=deskAgent.id;
    const ceo=displayAgents.find(agent=>rosterKeyOf(agent.id,agent.role)==="ceo");
    const ceoId=ceo?.id||"ceo";
    const talk=usePixelOfficeLiveStore.getState().sendAgentMessage;
    const snippet=goal.trim().slice(0,80);
    if(rosterKeyOf(reporterId,reportedBy)==="ceo"){
      talk(ceoId,ceoId,t("pixel.deskCeoSelfSpeech"));
    }else{
      talk(reporterId,ceoId,t("pixel.deskReportSpeech").replace("{goal}",snippet));
      talk(ceoId,reporterId,t("pixel.deskCeoAckSpeech"));
    }
    setGoal(goal);
    sendOffice({
      action:"execute_autonomous_mission",
      data:{
        projectId:activeProject.id,
        projectPath:activeProject.path,
        goal,
        assignedRole:"CEO",
        reportedBy,
        reporterId,
        agents:displayAgents.map(agent=>({id:agent.id,role:agent.role||agent.id})),
        preferredProvider:activeProject.provider||"auto",
        projectProvider:activeProject.provider||"auto",
        approved:false
      }
    });
    closeDesk();
  };

  return <section className="panel pixel-office-runtime pixel-office-with-chat">
    <div className="pixel-office-floor-col">
      <div className="section-heading">
        <div><div className="eyebrow">{t("pixel.title").toUpperCase()}</div><h2>{t("pixel.subtitle")}</h2></div>
        <span>{t("pixel.activeCount").replace("{n}",String(activeCount))} · {t("pixel.agentCount").replace("{n}",String(displayAgents.length))}</span>
      </div>

      <PixelOfficeV2Canvas
        agents={displayAgents.map(agent=>({
          id:agent.id,
          role:agent.role,
          state:agent.state,
          station:(agent.station==="mailbox"?"lounge":agent.station) as any,
          targetStation:(agent.targetStation==="mailbox"?"lounge":agent.targetStation) as any,
          speech:agent.speech,
          progress:agent.progress
        }))}
        onAgentClick={openAgentDesk}
        messages={messages}
        theme={officeTheme}
      />

      <div className="pixel-office-legend pixel-office-v2-legend">
        <span>● {t("office.idle")}</span>
        <span>● {t("office.thinking")}</span>
        <span>● {t("office.moving")}</span>
        <span>● {t("office.working")}</span>
        <span>● {t("office.testing")}</span>
        <span>● {t("office.blocked")}</span>
        <span>● {t("office.done")}</span>
        <small>{t("pixel.controls")}</small>
      </div>
    </div>

    <FloorChatPanel agents={chatAgents} onAgentOpen={openAgentDesk}/>

    <AgentDeskModal
      open={!!deskAgent}
      agent={deskAgent}
      hasSession={!!deskSession}
      canAssign={!!activeProject}
      onClose={closeDesk}
      onAssign={assignDeskTask}
      onOpenTerminal={()=>{
        if(!deskAgent||!activeProject){setTerminalOpen(true);return;}
        if(!deskSession && activeProject.runnerTrusted){
          sendOffice({
            action:"runtime_spawn",
            project_id:activeProject.id,
            provider:activeProject.provider||"auto",
            agent_id:deskAgent.id,
            role:deskAgent.role||deskAgent.id,
            task:`Live ${deskAgent.role||deskAgent.id} desk session`
          });
        }
        setTerminalOpen(true);
      }}
    />
    <TerminalModal open={terminalOpen} onClose={()=>setTerminalOpen(false)}/>
  </section>;
}
