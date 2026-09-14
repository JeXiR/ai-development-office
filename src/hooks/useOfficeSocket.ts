"use client";

import { useEffect, useRef } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useUxStore } from "@/store/useUxStore";
import { useMissionRunnerStore } from "@/mission-runner/store";
import { useProjectDocsStore } from "@/store/useProjectDocsStore";
import { useCollaborationStore } from "@/store/useCollaborationStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useCoordinationStore } from "@/store/useCoordinationStore";
import { useMemoryV2Store } from "@/store/useMemoryV2Store";
import { useIntegrationV2Store } from "@/store/useIntegrationV2Store";
import { useDistributedStore } from "@/store/useDistributedStore";
import { useInstallerStore } from "@/store/useInstallerStore";
import { usePluginV2Store } from "@/store/usePluginV2Store";
import { useGovernanceStore } from "@/store/useGovernanceStore";
import { useSafetyStore } from "@/store/useSafetyStore";
import { useProviderStore } from "@/store/useProviderStore";
import { usePixelOfficeStore } from "@/store/usePixelOfficeStore";
import { useAutomationStore } from "@/store/useAutomationStore";
import { useLedgerStore } from "@/store/useLedgerStore";
import { usePluginStore } from "@/store/usePluginStore";
import { useGitIntelligenceStore } from "@/store/useGitIntelligenceStore";
import { useProvenanceStore } from "@/store/useProvenanceStore";
import { useIntegrationStore } from "@/store/useIntegrationStore";
import { useWorkerStore } from "@/store/useWorkerStore";
import { useReplayStore } from "@/store/useReplayStore";
import { useGitCodeStore } from "@/store/useGitCodeStore";
import { useAutonomyStore } from "@/store/useAutonomyStore";
import { useSafetyV2Store } from "@/store/useSafetyV2Store";
import type { OfficeEvent, OfficeProject, OfficeState, RunnerStatus } from "@/types/office";
import { usePixelOfficeLiveStore } from "@/pixel-office-v2/live-store";
import { roleToStation } from "@/pixel-office-v2/runtime-map";
import { useFinalAcceptanceStore } from "@/store/useFinalAcceptanceStore";

let sharedSocket: WebSocket | null = null;
let socketGeneration = 0;
const pendingSends: string[] = [];

export function getOfficeSocket() { return sharedSocket; }

export function sendOffice(payload: unknown) {
  const data = JSON.stringify(payload);
  if (sharedSocket?.readyState === WebSocket.OPEN) {
    sharedSocket.send(data);
    return true;
  }
  pendingSends.push(data);
  return false;
}

function flushPendingSends() {
  if (sharedSocket?.readyState !== WebSocket.OPEN) return;
  while (pendingSends.length) sharedSocket.send(pendingSends.shift() as string);
}

export function useOfficeSocket() {
  const setConnected = useOfficeStore((s) => s.setConnected);
  const setProjects = useOfficeStore((s) => s.setProjects);
  const setCommandHistory = useOfficeStore((s) => s.setCommandHistory);
  const setRunnerStatus = useOfficeStore((s) => s.setRunnerStatus);
  const setAgentNames = useOfficeStore((s) => s.setAgentNames);
  const upsertState = useOfficeStore((s) => s.upsertState);
  const upsertWorkbench = useOfficeStore((s) => s.upsertWorkbench);
  const upsertCoverage = useOfficeStore((s) => s.upsertCoverage);
  const upsertFeatureContracts = useOfficeStore((s) => s.upsertFeatureContracts);
  const upsertAgentAnalytics = useOfficeStore((s) => s.upsertAgentAnalytics);
  const pushEvent = useOfficeStore((s) => s.pushEvent);
  const setMissionSettings = useOfficeStore((s) => s.setMissionSettings);
  const upsertTaskReport = useOfficeStore((s) => s.upsertTaskReport);
  const upsertSkills = useOfficeStore((s) => s.upsertSkills);
  const setAuditTrail = useOfficeStore((s)=>s.setAuditTrail);
  const setRecovery = useOfficeStore((s)=>s.setRecovery);
  const upsertReleaseGate = useOfficeStore((s)=>s.upsertReleaseGate);
  const upsertDoctor = useOfficeStore((s)=>s.upsertDoctor);
  const setRetention = useOfficeStore((s)=>s.setRetention);
  const setBackupResult = useOfficeStore((s)=>s.setBackupResult);
  const setReleaseActionResult = useOfficeStore((s)=>s.setReleaseActionResult);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_OFFICE_WS_URL ?? "ws://localhost:8787";
    let disposed = false;

    const generation = ++socketGeneration;
    const connect = () => {
      if (disposed || generation !== socketGeneration) return;
      const socket = new WebSocket(url);
      sharedSocket = socket;

      socket.onopen = () => {
        if (sharedSocket !== socket) return;
        setConnected(true);
        flushPendingSends();
        socket.send(JSON.stringify({ action: "get_projects" }));
        socket.send(JSON.stringify({ action: "get_runner_status" }));
      };

      socket.onclose = () => {
        if (sharedSocket === socket) {
          sharedSocket = null;
          setConnected(false);
        }
        if (!disposed && generation === socketGeneration) retryRef.current = setTimeout(connect, 1800);
      };
      socket.onerror = () => {
        if (sharedSocket === socket) setConnected(false);
      };

      socket.onmessage = (message) => {
        let payload: any;
        try {
          payload = JSON.parse(message.data);
        } catch (error) {
          console.error("Office socket parse failed", error);
          return;
        }
        try {
          if (payload.type === "project_response_language") {
            useOfficeStore.getState().setProjectResponseLanguage(String(payload.projectId||""),String(payload.responseLanguage||"en"));
          }
          if (payload.type === "workspace_files") useWorkspaceStore.getState().setFiles(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "workspace_file_error" || (payload.type === "error" && useWorkspaceStore.getState().pendingPath)) {
            useWorkspaceStore.getState().setFileError(String(payload.data?.message||payload.message||"File could not be opened."));
          }
          if (payload.type === "error" && !useWorkspaceStore.getState().pendingPath) {
            const message=String(payload.message||payload.data?.message||"Unknown bridge error");
            useUxStore.getState().pushToast({
              id:`bridge-error-${Date.now()}`,
              kind:"error",
              title:"Office error",
              message,
              createdAt:new Date().toISOString(),
              timeoutMs:8000
            });
          }
          if (payload.type === "workspace_file" && payload.data) {
            useWorkspaceStore.getState().setActiveFile(payload.data);
            const rel=String(payload.data.relativePath||"");
            if(rel){
              const title=rel.split("/").pop()||rel;
              useUxStore.getState().openTab({id:`file:${rel}`,kind:"file",title,resource:rel,pinned:false});
            }
          }
          if (payload.type === "autonomous_mission_event") {
            useMissionRunnerStore.getState().ingestEvent(payload.data||payload);
            usePixelOfficeLiveStore.getState().ingest(payload.data||payload);
          }
          if (payload.type === "autonomous_mission_result") useMissionRunnerStore.getState().setResult(payload.data);
          if (payload.type === "real_project_execution") {
            useMissionRunnerStore.getState().setBusy(false);
            useMissionRunnerStore.getState().setResult(payload.data);
            usePixelOfficeLiveStore.getState().ingest(payload.data||payload);
          }
          if (payload.type === "provider_stream_event") usePixelOfficeLiveStore.getState().ingest(payload.data||payload);
          if (payload.type === "project_docs_snapshot" && payload.data) {
            const projectId=useOfficeStore.getState().activeProjectId;
            if(projectId)useProjectDocsStore.getState().setSnapshot(projectId,payload.data);
          }
          if (payload.type === "project_docs_bootstrapped" && payload.data?.inspection) {
            const projectId=useOfficeStore.getState().activeProjectId;
            if(projectId)useProjectDocsStore.getState().setSnapshot(projectId,payload.data.inspection);
          }
          if (payload.type === "workspace_git_diff") {
            useWorkspaceStore.getState().setGitDiff(Array.isArray(payload.data)?payload.data:[]);
            if(payload.error)useWorkspaceStore.getState().setGitError(String(payload.error));
          }
          if (payload.type === "workspace_file_event") usePixelOfficeStore.getState().applyFile(String(payload.data?.relativePath||""),null);
          if (payload.type === "runtime_sessions") useWorkspaceStore.getState().setRuntimeSessions(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "runtime_event") {
            useWorkspaceStore.getState().appendRuntimeEvent(payload.data);
            usePixelOfficeStore.getState().applyRuntime(payload.data);
            usePixelOfficeLiveStore.getState().ingest(payload.data||payload);
          }
          if (payload.type === "collaboration_message" && payload.data) {
            usePixelOfficeLiveStore.getState().sendAgentMessage(
              String(payload.data.fromAgentId||payload.data.from_agent_id||"director"),
              String(payload.data.toAgentId||payload.data.to_agent_id||""),
              String(payload.data.subject||payload.data.body||"message")
            );
          }
          if (payload.type === "coordination_snapshot" && payload.data) {
            useCoordinationStore.getState().set({
              leases:payload.data.leases||[],
              receipts:payload.data.receipts||[],
              mcpId:payload.data.mcp?.id||null,
              templates:payload.data.templates||[],
              tools:payload.data.tools?.events||[],
              toolTree:payload.data.tools?.tree||[]
            });
          }
          if (payload.type === "ask_cli_result" && payload.data) {
            useCoordinationStore.getState().set({lastAsk:payload.data});
          }
          if (payload.type === "factory_status" && payload.data) {
            const projectId=String(payload.data.projectId||payload.data.project_id||"");
            if(projectId)useFactoryStore.getState().upsert(projectId, payload.data);
          }
          if (payload.type === "collaboration_snapshot") {
            useCollaborationStore.getState().setSnapshot(payload.data||{});
            usePixelOfficeStore.getState().syncTasks(Array.isArray(payload.data?.tasks)?payload.data.tasks:[]);
            const messages=Array.isArray(payload.data?.messages)?payload.data.messages:[];
            for(const message of messages.slice(-10))usePixelOfficeStore.getState().applyMessage(message);
            const tasks=Array.isArray(payload.data?.tasks)?payload.data.tasks:[];
            for(const task of tasks){
              if(!["working","running","planning","queued"].includes(String(task.status||"")))continue;
              usePixelOfficeLiveStore.getState().ingest({
                type:`task.${task.status}`,
                agentId:task.assignedAgentId||task.assignedRole,
                message:task.title,
                status:task.status
              });
            }
          }
if (payload.type === "safety_snapshot") {
            useSafetyStore.getState().setSnapshot(payload.data||{policy:null,incidents:[]});
          }
          if (payload.type === "provider_health") {
            useProviderStore.getState().setHealth(Array.isArray(payload.data)?payload.data:[]);
          }
          if (payload.type === "provider_route_decision") {
            useProviderStore.getState().setRouteDecision(payload.data||null);
          }
          if (["prerequisites","prerequisite_install_result","update_info","update_result","project_folder_selected","onboarding"].includes(String(payload.type||""))) window.dispatchEvent(new CustomEvent("office-bridge-message",{detail:payload}));
          if (payload.type === "automation_snapshot") useAutomationStore.getState().setSnapshot(payload.data||{missions:[],heartbeats:[]});
          if (payload.type === "ledger_snapshot") useLedgerStore.getState().setSnapshot(payload.data||{entries:[],summary:null});
          if (payload.type === "plugins_snapshot") usePluginStore.getState().setPlugins(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "git_graph") useGitIntelligenceStore.getState().setGraph(payload.data||null);
          if (payload.type === "git_working_tree") useGitIntelligenceStore.getState().setWorkingTree(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "git_commit_result" && payload.data?.hash) {
            useUxStore.getState().pushToast({
              id:`git-commit-${payload.data.hash}`,
              kind:"success",
              title:"Git",
              message:String(payload.data.hash).slice(0,8),
              createdAt:new Date().toISOString(),
              timeoutMs:5000
            });
          }
          if (payload.type === "git_snapshots") useGitIntelligenceStore.getState().setSnapshots(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "git_snapshot_result" && payload.data) {
            const current=useGitIntelligenceStore.getState().snapshots;
            const next=[payload.data,...current.filter((s:any)=>s.id!==payload.data.id)];
            useGitIntelligenceStore.getState().setSnapshots(next);
          }
          if (payload.type === "provenance_snapshot") useProvenanceStore.getState().setEvents(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "integrations_snapshot") useIntegrationStore.getState().setSnapshot(payload.data||{});
          if (payload.type === "workers_snapshot") useWorkerStore.getState().setSnapshot(payload.data||{});
          if (payload.type === "replay_sessions") useReplayStore.getState().setSessions(Array.isArray(payload.data)?payload.data:[]);
          if (payload.type === "replay_session") useReplayStore.getState().setSelected(payload.data||null);
          if (payload.type === "git_side_by_side") useGitCodeStore.getState().set({sideBySide:payload.data||null});
          if (payload.type === "git_blame") useGitCodeStore.getState().set({blame:payload.data||null});
          if (payload.type === "git_conflicts") useGitCodeStore.getState().set({conflicts:Array.isArray(payload.data)?payload.data:[]});
          if (payload.type === "git_conflict_inspection") useGitCodeStore.getState().set({conflictInspection:payload.data||null});
          if (payload.type === "git_bisect_plan") useGitCodeStore.getState().set({bisect:payload.data||null});
          if (payload.type === "git_scoped_diff") useGitCodeStore.getState().set({scopedDiff:payload.data||null});
          if (payload.type === "git_policy") useGitCodeStore.getState().set({policy:payload.data||null});
          if (payload.type === "git_pr_draft") useGitCodeStore.getState().set({prDraft:payload.data||null});
          if (payload.type === "autonomy_team") useAutonomyStore.getState().set({team:payload.data||null});
          if (payload.type === "autonomy_scores") useAutonomyStore.getState().set({scores:Array.isArray(payload.data)?payload.data:[]});
          if (payload.type === "autonomy_route") useAutonomyStore.getState().set({route:payload.data||null});
          if (payload.type === "autonomy_retry_strategy") useAutonomyStore.getState().set({retry:payload.data||null});
          if (payload.type === "autonomy_recovery") useAutonomyStore.getState().set({recovery:payload.data||null});
          if (payload.type === "safety_v2_snapshot") useSafetyV2Store.getState().set({approvals:payload.data?.approvals||[],profile:payload.data?.profile||null,permissionPolicy:payload.data?.permissionPolicy||null});
          if (payload.type === "safety_command_risk") useSafetyV2Store.getState().set({commandRisk:payload.data||null});
          if (payload.type === "safety_authorization_result") useSafetyV2Store.getState().set({authorization:payload.data||null});
          if (payload.type === "safety_budget_result") useSafetyV2Store.getState().set({budget:payload.data||null});
          if (payload.type === "memory_v2_snapshot") useMemoryV2Store.getState().set({records:payload.data?.records||[],graph:payload.data?.graph||null});
          if (payload.type === "memory_v2_search_result") useMemoryV2Store.getState().set({hits:Array.isArray(payload.data)?payload.data:[]});
          if (payload.type === "memory_v2_specialties") useMemoryV2Store.getState().set({specialties:Array.isArray(payload.data)?payload.data:[]});
          if (payload.type === "integration_v2_snapshot") useIntegrationV2Store.getState().set({audit:payload.data?.audit||[],watches:payload.data?.watches||[]});
          if (payload.type === "integration_v2_result") useIntegrationV2Store.getState().set({lastResult:payload.data||null});
          if (payload.type === "distributed_snapshot") useDistributedStore.getState().set({jobs:payload.data?.jobs||[],capabilities:payload.data?.capabilities||[]});
          if (payload.type === "distributed_job_output") useDistributedStore.getState().appendLog(String(payload.jobId||""),String(payload.data?.chunk||""));
          if (payload.type === "distributed_job_log") useDistributedStore.getState().set({logs:{...useDistributedStore.getState().logs,[String(payload.data?.jobId||"")]:String(payload.data?.text||"")}});
          if (payload.type === "distributed_artifact_result") useDistributedStore.getState().set({lastArtifact:payload.data||null});
          if (payload.type === "installer_snapshot") useInstallerStore.getState().set({prerequisites:payload.data?.prerequisites||[],version:payload.data?.version||null,runtime:payload.data?.runtime||null,codesign:payload.data?.codesign||null});
          if (payload.type === "first_run_diagnostics") useInstallerStore.getState().set({diagnostics:payload.data||null});
          if (payload.type === "update_stage_result") useInstallerStore.getState().set({staged:payload.data||null});
          if (payload.type === "update_verify_result") useInstallerStore.getState().set({staged:payload.data||null});
          if (payload.type === "update_apply_result" || payload.type === "update_rollback_result") useInstallerStore.getState().set({lastUpdateResult:payload.data||null});
          if (payload.type === "plugin_v2_snapshot") usePluginV2Store.getState().set({manifests:payload.data?.manifests||[],states:payload.data?.states||[],contributions:payload.data?.contributions||{providers:[],tools:[],triggers:[],panels:[]}});
          if (payload.type === "plugin_v2_result") usePluginV2Store.getState().set({lastResult:Array.isArray(payload.data)?payload.data:[]});
          if (payload.type === "governance_snapshot") useGovernanceStore.getState().set({policy:payload.data?.policy||null,members:payload.data?.members||[],decisions:payload.data?.decisions||[],waivers:payload.data?.waivers||[],evidence:payload.data?.evidence||[],signoffs:payload.data?.signoffs||[],audit:payload.data?.audit||null,stableAcceptance:payload.data?.stableAcceptance||null,release:payload.data?.release||null});
          if (payload.type === "governance_decision_result" && payload.data) {
            const current=useGovernanceStore.getState();
            current.set({decisions:[...current.decisions.filter((d:any)=>d.id!==payload.data.id),payload.data]});
          }
          if (payload.type === "governance_evidence_result" && payload.data) {
            const current=useGovernanceStore.getState();
            current.set({evidence:[...current.evidence.filter((e:any)=>e.id!==payload.data.id),payload.data]});
          }
          if (payload.type === "governance_audit_result") useGovernanceStore.getState().set({audit:payload.data||null});
          if (payload.type === "command_history") {
            setCommandHistory(payload.data);
            usePixelOfficeLiveStore.getState().ingestCommands(Array.isArray(payload.data)?payload.data:[]);
          }
          else if (payload.type === "runner_status") setRunnerStatus(payload.data as RunnerStatus);
          else if (payload.type === "agent_names") setAgentNames(payload.data || {});
          else if (payload.type === "projects") setProjects(payload.data as OfficeProject[]);
          else if (payload.type === "state") {
            upsertState(payload.data as OfficeState);
            const agents=Array.isArray((payload.data as OfficeState)?.agents)?(payload.data as OfficeState).agents:[];
            usePixelOfficeLiveStore.getState().seedAgents(agents.map(agent=>({
              id:agent.id,
              role:agent.role,
              station:roleToStation(String(agent.role||agent.id))
            })));
          }
          else if (payload.type === "workbench") upsertWorkbench(payload.data);
          else if (payload.type === "coverage") upsertCoverage(payload.data);
          else if (payload.type === "feature_contracts") upsertFeatureContracts(payload.data);
          else if (payload.type === "agent_analytics") upsertAgentAnalytics(payload.data);
          else if (payload.type === "event") {
            pushEvent(payload.data as OfficeEvent);
            const ev=payload.data as OfficeEvent;
            usePixelOfficeLiveStore.getState().ingest({
              type:ev.event_type,
              agentId:ev.actor?.id||ev.actor?.role,
              message:ev.task||ev.message,
              status:ev.status
            });
          }
          else if (payload.type === "mission_settings") setMissionSettings(payload.data);
          else if (payload.type === "task_report") upsertTaskReport(payload.data);
          else if (payload.type === "skills") upsertSkills(payload.data);
          else if (payload.type === "audit_trail") setAuditTrail(payload.data||[]);
          else if (payload.type === "recovery") setRecovery(payload.data);
          else if (payload.type === "release_gate") upsertReleaseGate(payload.data);
          else if (payload.type === "doctor") upsertDoctor(payload.data);
          else if (payload.type === "retention") setRetention(payload.data);
          else if (payload.type === "backup_result") setBackupResult(payload.data);
          else if (payload.type === "release_action_result") setReleaseActionResult(payload.data);
          else if (payload.type === "final_acceptance" || payload.type === "final_acceptance_updated") useFinalAcceptanceStore.getState().set({acceptance:payload.data||null});
          else if (payload.type === "version_consistency") useFinalAcceptanceStore.getState().set({version:payload.data||null});
          else if (payload.type === "package_integrity") useFinalAcceptanceStore.getState().set({integrity:payload.data||null});
        } catch (error) {
          console.error("Office socket handler failed", payload?.type, error);
          useUxStore.getState().pushToast({
            id:`socket-handler-${Date.now()}`,
            kind:"error",
            title:"Office update failed",
            message:`${payload?.type||"message"}: ${error instanceof Error?error.message:"handler error"}`,
            createdAt:new Date().toISOString(),
            timeoutMs:8000
          });
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      const socket = sharedSocket;
      sharedSocket = null;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      }
      setConnected(false);
    };
  }, []);
}
