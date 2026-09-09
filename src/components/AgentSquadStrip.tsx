"use client";

import { useMemo } from "react";
import { useLiveOfficeState } from "@/hooks/useLiveOfficeAgents";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
import { useAgentDeskStore } from "@/store/useAgentDeskStore";

const BUSY=new Set(["working","planning","reviewing","testing","reading"]);

export function AgentSquadStrip(){
  const {t}=useOfficeI18n();
  const state=useLiveOfficeState();
  const allNames=useOfficeStore(s=>s.agentNames);
  const names=useMemo(()=>allNames[state.projectId]??{},[allNames,state.projectId]);
  const openDesk=useAgentDeskStore(s=>s.open);
  const active=state.agents.filter(a=>BUSY.has(a.status)).length;

  return <section className="agent-squad panel">
    <div className="squad-title">
      <span>{t("squad.title")}</span>
      <strong>{t("squad.active").replace("{n}",String(active)).replace("{total}",String(state.agents.length))}</strong>
    </div>
    <div className="squad-scroll">
      {state.agents.map(agent=>{
        const busy=BUSY.has(agent.status);
        const showProgress=busy&&typeof agent.progressPercent==="number";
        return <button type="button" key={agent.id} className={`squad-card squad-${agent.status}`} onClick={()=>openDesk(agent.id)}>
          <div className="squad-avatar">{(names[agent.id]||agent.role).slice(0,2).toUpperCase()}</div>
          <div>
            <strong>{names[agent.id]||agent.role}</strong>
            <span>{agent.role}</span>
            <small><i/>{t(`office.${agent.status}`,agent.status)}</small>
          </div>
          {showProgress?<b title={t("squad.taskProgressHint")}>{agent.progressPercent}%</b>:null}
        </button>;
      })}
    </div>
  </section>;
}
