"use client";

import { useMemo } from "react";
import {
  EMPTY_EVENTS,
  EMPTY_STATE,
  useOfficeStore,
} from "@/store/useOfficeStore";
import type { ProjectWorkbenchState } from "@/types/work";

export function useActiveProjectState() {
  const activeProjectId = useOfficeStore((s) => s.activeProjectId);
  const project = useOfficeStore((s) =>
    s.projects.find((p) => p.id === s.activeProjectId)
  );
  const state = useOfficeStore((s) =>
    activeProjectId ? s.states[activeProjectId] : undefined
  );

  if(state){
    if(project&&(!state.projectName||state.projectName==="No project selected")){
      return {...state,projectId:project.id,projectName:project.name,projectPath:state.projectPath||project.path};
    }
    return state;
  }
  if(project){
    return {...EMPTY_STATE,projectId:project.id,projectName:project.name,projectPath:project.path};
  }
  return EMPTY_STATE;
}

export function useActiveProjectEvents() {
  const activeProjectId = useOfficeStore((s) => s.activeProjectId);
  const events = useOfficeStore((s) =>
    activeProjectId ? s.eventsByProject[activeProjectId] : undefined
  );

  return events ?? EMPTY_EVENTS;
}

export function useActiveProjectQueue() {
  const activeProjectId = useOfficeStore((s) => s.activeProjectId);
  const commandHistory = useOfficeStore((s) => s.commandHistory);

  return useMemo(() => {
    if (!activeProjectId) return [];

    return commandHistory
      .filter(
        (item) =>
          item.projectId === activeProjectId &&
          ["queued", "waiting_for_agent", "running"].includes(item.status)
      )
      .slice()
      .sort(
        (a, b) =>
          (a.queueSequence ?? Number.MAX_SAFE_INTEGER) -
            (b.queueSequence ?? Number.MAX_SAFE_INTEGER) ||
          a.createdAt.localeCompare(b.createdAt)
      );
  }, [activeProjectId, commandHistory]);
}


export const EMPTY_WORKBENCH: ProjectWorkbenchState = {
  projectId: "none",
  generatedAt: "",
  workItems: [],
  frontendCoverage: [],
  summary: {
    todo: 0,
    fixing: 0,
    done: 0,
    deferred: 0,
    frontendVerified: 0,
    frontendPartial: 0,
    frontendMissing: 0,
    frontendUnknown: 0,
  },
};

export function useActiveProjectWorkbench() {
  const activeProjectId = useOfficeStore((s) => s.activeProjectId);
  const workbench = useOfficeStore((s) =>
    activeProjectId ? s.workbenches[activeProjectId] : undefined
  );
  if(!workbench)return EMPTY_WORKBENCH;
  return {
    ...EMPTY_WORKBENCH,
    ...workbench,
    workItems:Array.isArray(workbench.workItems)?workbench.workItems:[],
    frontendCoverage:Array.isArray(workbench.frontendCoverage)?workbench.frontendCoverage:[],
    summary:{...EMPTY_WORKBENCH.summary,...(workbench.summary||{})}
  };
}


import type { ProjectCoverageReport } from "@/types/coverage";
import type { FeatureContractsState } from "@/types/feature-contract";

export const EMPTY_COVERAGE: ProjectCoverageReport = {
  projectId:"none",generatedAt:"",overallScore:0,overallConfidence:"low",unknownCount:0,
  weights:{backend:20,frontend:15,security:25,tests:20,database:10,docs:5,devops:5,"ai-integrations":0},
  extras:[],
  hasProgressDoc:false,
  domains:{
    backend:{domain:"backend",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    frontend:{domain:"frontend",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    security:{domain:"security",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    tests:{domain:"tests",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    database:{domain:"database",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    docs:{domain:"docs",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    devops:{domain:"devops",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
    "ai-integrations":{domain:"ai-integrations",score:0,confidence:"low",verified:0,partial:0,missing:0,unknown:0,deferred:0,checks:[],largestGaps:[]},
  }
};
export const EMPTY_FEATURE_CONTRACTS: FeatureContractsState = {projectId:"none",generatedAt:"",contracts:[],openQuestions:0};

export function useActiveProjectCoverage() {
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const coverage=useOfficeStore(s=>activeProjectId?s.coverageReports[activeProjectId]:undefined);
  return coverage??EMPTY_COVERAGE;
}
export function useActiveFeatureContracts() {
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const contracts=useOfficeStore(s=>activeProjectId?s.featureContracts[activeProjectId]:undefined);
  return contracts??EMPTY_FEATURE_CONTRACTS;
}


import type { OfficeAgentAnalytics } from "@/types/analytics";

export const EMPTY_AGENT_ANALYTICS: OfficeAgentAnalytics = {
  projectId:"none",
  generatedAt:"",
  rows:[],
  totalCommands:0,
  totalCompleted:0,
  totalFailed:0,
  parallelPeak:0,
};

export function useActiveAgentAnalytics(){
  const activeProjectId=useOfficeStore((s)=>s.activeProjectId);
  const analytics=useOfficeStore((s)=>activeProjectId?s.agentAnalytics[activeProjectId]:undefined);
  return analytics??EMPTY_AGENT_ANALYTICS;
}
