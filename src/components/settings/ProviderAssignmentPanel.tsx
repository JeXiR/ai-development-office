"use client";

import {useMemo,useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

const providers=["auto","openai","anthropic","gemini","xai","groq","cursor","opencode","ollama","openai-compatible"];

export function ProviderAssignmentPanel(){
  const {t}=useOfficeI18n();
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const states=useOfficeStore(s=>s.states);
  const agents=activeProjectId?states[activeProjectId]?.agents??[]:[];
  const [pins,setPins]=useState<any[]>([]);
  const [policy,setPolicy]=useState<any>(null);
  const [evidence,setEvidence]=useState<any>(null);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="provider_assignments"){setPins(m.data?.pins||[]);setPolicy(m.data?.policy||null);}
        if(m.type==="provider_route_evidence")setEvidence(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    sendOffice({action:"get_provider_assignments"});
    return()=>socket.removeEventListener("message",onMessage);
  });

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  const pinMap=useMemo(()=>new Map(pins.map((x:any)=>[x.agentId,x])),[pins]);

  const updatePin=(agentId:string,providerId:string)=>{
    send("set_agent_provider_pin",{agentId,providerId,model:pinMap.get(agentId)?.model||null});
  };

  const updateModel=(agentId:string,model:string)=>{
    send("set_agent_provider_pin",{agentId,providerId:pinMap.get(agentId)?.providerId||"auto",model:model||null});
  };

  const updatePreference=(preference:string)=>{
    send("save_provider_policy",{...policy,preference});
  };

  const updateMaxAttempts=(value:number)=>{
    send("save_provider_policy",{...policy,fallback:{...(policy?.fallback||{}),maxAttempts:value}});
  };

  const testRoute=(agentId?:string)=>{
    send("route_with_provider_policy",{agentId,requires:["coding","reasoning"]});
  };

  return <section className="panel provider-assignment-panel" data-help="provider-assignment">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("settings.routingEyebrow")}</div>
        <h2>{t("settings.routingTitle")}</h2>
      </div>
      <span>{t("routing.pinned").replace("{n}",String(pins.length))}</span>
    </div>

    <div className="provider-policy-bar">
      <label>{t("routing.preference")}
        <select value={policy?.preference||"balanced"} onChange={e=>updatePreference(e.target.value)}>
          <option value="balanced">{t("routing.balanced")}</option>
          <option value="quality">{t("routing.quality")}</option>
          <option value="cost">{t("routing.cost")}</option>
          <option value="latency">{t("routing.latency")}</option>
        </select>
      </label>
      <label>{t("routing.maxFailover")}
        <select value={policy?.fallback?.maxAttempts||3} onChange={e=>updateMaxAttempts(Number(e.target.value))}>
          {[1,2,3,4,5].map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </label>
      <button onClick={()=>testRoute()}>{t("settings.testGlobalRoute")}</button>
    </div>

    <div className="provider-assignment-grid">
      {agents.map((agent:any)=>{
        const pin:any=pinMap.get(agent.id)||{providerId:"auto",model:""};
        return <article key={agent.id} className="provider-assignment-card">
          <div><strong>{agent.name||agent.id}</strong><span>{agent.role||"agent"}</span></div>
          <label>{t("routing.provider")}
            <select value={pin.providerId||"auto"} onChange={e=>updatePin(agent.id,e.target.value)}>
              {providers.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>{t("routing.model")}
            <input value={pin.model||""} onChange={e=>updateModel(agent.id,e.target.value)} placeholder={t("routing.modelPlaceholder")}/>
          </label>
          <button onClick={()=>testRoute(agent.id)}>{t("settings.testRoute")}</button>
        </article>;
      })}
    </div>

    {evidence?<div className="provider-route-evidence">
      <strong>{t("routing.evidence")}</strong>
      <span>{evidence.providerId||"none"} · score {evidence.score}</span>
      <small>{(evidence.reasons||[]).join(" · ")}</small>
      <code>{evidence.evidenceId||""}</code>
    </div>:null}
  </section>;
}
