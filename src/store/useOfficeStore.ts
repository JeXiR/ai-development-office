"use client";

import { create } from "zustand";
import type { OfficeEvent, OfficeProject, OfficeState, RunnerStatus } from "@/types/office";
import type { OfficeCommandRequest } from "@/types/command";
import type { ProjectWorkbenchState } from "@/types/work";
import type { ProjectCoverageReport } from "@/types/coverage";
import type { FeatureContractsState } from "@/types/feature-contract";
import type { OfficeAgentAnalytics } from "@/types/analytics";
import type { OfficeMissionSettings, TaskExecutionReport, OfficeAuditEntry, OfficeRecoverySnapshot, OfficeReleaseGate, OfficeDoctorSnapshot, OfficeRetentionSettings, OfficeBackupResult, OfficeReleaseActionResult } from "@/types/mission";
import type { ProjectSkillsSnapshot } from "@/types/skills";
import {pickActiveProjectId,readProjectsCache,writeProjectsCache} from "./project-cache";

export const EMPTY_EVENTS: OfficeEvent[] = [];
export const EMPTY_STATE: OfficeState = {
  projectId: "none",
  projectName: "No project selected",
  projectPath: undefined,
  milestone: null,
  activeTask: null,
  health: "unknown",
  roadmapPercent: null,
  remainingPercent: null,
  counts: { done: 0, partial: 0, todo: 0, bugs: 0, blockers: 0 },
  findings: [],
  agents: [],
};

interface OfficeStore {
  projects: OfficeProject[];
  activeProjectId: string | null;
  projectResponseLanguages: Record<string,string>;
  states: Record<string, OfficeState>;
  eventsByProject: Record<string, OfficeEvent[]>;
  connected: boolean;
  commandHistory: OfficeCommandRequest[];
  runnerStatus: RunnerStatus | null;
  workbenches: Record<string, ProjectWorkbenchState>;
  coverageReports: Record<string, ProjectCoverageReport>;
  featureContracts: Record<string, FeatureContractsState>;
  agentAnalytics: Record<string, OfficeAgentAnalytics>;
  agentNames: Record<string, Record<string, string>>;
  missionSettings: OfficeMissionSettings;
  taskReports: Record<string, TaskExecutionReport>;
  skillsByProject: Record<string, ProjectSkillsSnapshot>;
  auditTrail: OfficeAuditEntry[];
  recovery: OfficeRecoverySnapshot | null;
  releaseGates: Record<string,OfficeReleaseGate>;
  doctorByProject: Record<string,OfficeDoctorSnapshot>;
  retention: OfficeRetentionSettings;
  backupResult: OfficeBackupResult | null;
  releaseActionResult: OfficeReleaseActionResult | null;
  setConnected: (connected: boolean) => void;
  setProjects: (projects: OfficeProject[]) => void;
  setCommandHistory: (history: OfficeCommandRequest[]) => void;
  setRunnerStatus: (status: RunnerStatus) => void;
  upsertWorkbench: (workbench: ProjectWorkbenchState) => void;
  upsertCoverage: (coverage: ProjectCoverageReport) => void;
  upsertFeatureContracts: (contracts: FeatureContractsState) => void;
  upsertAgentAnalytics: (analytics: OfficeAgentAnalytics) => void;
  setAgentNames: (names: Record<string,Record<string,string>>) => void;
  setMissionSettings: (settings: OfficeMissionSettings) => void;
  upsertTaskReport: (report: TaskExecutionReport) => void;
  upsertSkills: (snapshot: ProjectSkillsSnapshot) => void;
  setAuditTrail:(entries:OfficeAuditEntry[])=>void;
  setRecovery:(snapshot:OfficeRecoverySnapshot)=>void;
  upsertReleaseGate:(gate:OfficeReleaseGate)=>void;
  upsertDoctor:(snapshot:OfficeDoctorSnapshot)=>void;
  setRetention:(settings:OfficeRetentionSettings)=>void;
  setBackupResult:(result:OfficeBackupResult)=>void;
  setReleaseActionResult:(result:OfficeReleaseActionResult)=>void;
  selectProject: (id: string) => void;
  setProjectResponseLanguage: (projectId:string, language:string) => void;
  upsertState: (state: OfficeState) => void;
  pushEvent: (event: OfficeEvent) => void;
}

const bootCache=readProjectsCache();

export const useOfficeStore = create<OfficeStore>((set) => ({
  projects: bootCache.projects,
  activeProjectId: bootCache.activeProjectId,
  projectResponseLanguages: {},
  states: {},
  eventsByProject: {},
  connected: false,
  commandHistory: [],
  runnerStatus: null,
  workbenches: {},
  coverageReports: {},
  featureContracts: {},
  agentAnalytics: {},
  agentNames: {},
  missionSettings:{scheduledAudits:[],officeTheme:"classic-cc0",usageTelemetry:{tokenSource:"unavailable",costSource:"unavailable"}},
  taskReports:{},
  skillsByProject:{},
  auditTrail:[], recovery:null, releaseGates:{}, doctorByProject:{},
  retention:{reportsDays:30,auditDays:90,worktreeDays:7},
  backupResult:null,
  releaseActionResult:null,

  setConnected: (connected) => set({ connected }),
  setCommandHistory: (commandHistory) => set({ commandHistory }),
  setRunnerStatus: (runnerStatus) => set({ runnerStatus }),
  upsertWorkbench: (workbench) => set((current) => ({
    workbenches: { ...current.workbenches, [workbench.projectId]: workbench },
  })),
  upsertCoverage: (coverage) => set((current) => ({
    coverageReports: { ...current.coverageReports, [coverage.projectId]: coverage },
  })),
  upsertFeatureContracts: (contracts) => set((current) => ({
    featureContracts: { ...current.featureContracts, [contracts.projectId]: contracts },
  })),
  upsertAgentAnalytics: (analytics) => set((current) => ({
    agentAnalytics: { ...current.agentAnalytics, [analytics.projectId]: analytics },
  })),
  setAgentNames: (agentNames) => set({ agentNames }),
  setMissionSettings: (missionSettings) => set({ missionSettings }),
  upsertTaskReport: (report) => set((current)=>({taskReports:{...current.taskReports,[report.id]:report}})),
  upsertSkills: (snapshot) => set((current)=>({skillsByProject:{...current.skillsByProject,[snapshot.projectId]:snapshot}})),
  setAuditTrail:(auditTrail)=>set({auditTrail}),
  setRecovery:(recovery)=>set({recovery}),
  upsertReleaseGate:(gate)=>set(current=>({releaseGates:{...current.releaseGates,[gate.projectId]:gate}})),
  upsertDoctor:(snapshot)=>set(current=>({doctorByProject:{...current.doctorByProject,[snapshot.projectId]:snapshot}})),
  setRetention:(retention)=>set({retention}),
  setBackupResult:(backupResult)=>set({backupResult}),
  setReleaseActionResult:(releaseActionResult)=>set({releaseActionResult}),

  setProjects: (projects) =>
    set((current) => {
      const incoming=Array.isArray(projects)?projects:[];
      if(!incoming.length&&current.projects.length)return current;
      const cached=readProjectsCache();
      const nextId=pickActiveProjectId(incoming,current.activeProjectId||cached.activeProjectId);
      writeProjectsCache(incoming,nextId);
      return {
        projects:incoming,
        activeProjectId: nextId,
      };
    }),

  selectProject: (id) => {
    set((current) => {
      writeProjectsCache(current.projects,id);
      return { activeProjectId: id };
    });
  },
  setProjectResponseLanguage: (projectId,language) => set(current => ({ projectResponseLanguages: { ...current.projectResponseLanguages, [projectId]: language } })),

  upsertState: (state) =>
    set((current) => ({
      states: { ...current.states, [state.projectId]: state },
    })),

  pushEvent: (event) =>
    set((current) => {
      const list = current.eventsByProject[event.project_id] ?? EMPTY_EVENTS;
      return {
        eventsByProject: {
          ...current.eventsByProject,
          [event.project_id]: [event, ...list].slice(0, 80),
        },
      };
    }),
}));

if(typeof window!=="undefined"){
  const cached=readProjectsCache();
  if(cached.projects.length){
    useOfficeStore.setState({
      projects:cached.projects,
      activeProjectId:cached.activeProjectId
    });
  }
}
