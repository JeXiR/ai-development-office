import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { loadEnvFile } from "node:process";
import { WebSocket, WebSocketServer } from "ws";
import crypto from "node:crypto";
import {RuntimeEventBus} from "../src/runtime/event-bus";
import {AgentProcessManager} from "../src/runtime/process-manager";
import {providerAdapter} from "../src/runtime/providers";
import type {RuntimeProvider} from "../src/runtime/types";
import {WorkspaceService} from "../src/workspace/service";
import {WorkspaceWatcher} from "../src/workspace/watcher";
import {CollaborationService} from "../src/collaboration/service";
import {MemoryService} from "../src/memory/service";
import {SafetyService} from "../src/safety/service";
import {ProviderEngine} from "../src/providers/engine";
import type {ProviderId} from "../src/providers/types";
import {checkPrerequisites,installPrerequisite,type PrerequisiteId} from "../src/onboarding/prerequisites";
import {chooseProjectFolder} from "../src/onboarding/folder-picker";
import {isMutatingCommand,laneFor,normalizeLane,pickQueueItems,READ_ONLY_COMMANDS} from "./queue-lanes";
import {OfficeUpdater} from "../src/updater/service";
import packageJson from "../package.json";
import {AutomationEngine} from "../src/automation/engine";
import type {MissionCadence} from "../src/automation/types";
import {LedgerStore} from "../src/ledger/store";
import {PluginRegistry} from "../src/plugins/registry";
import {GitIntelligenceService} from "../src/git-intelligence/service";
import {AutoGitPolicyStore} from "../src/git-intelligence/policy";
import {MergeConflictAssistant} from "../src/git-intelligence/merge-assistant";
import {AgentScoringService} from "../src/autonomy/agent-scoring";
import {DynamicTeamBuilder} from "../src/autonomy/team-builder";
import {AutonomousRouter} from "../src/autonomy/router";
import {IntelligentRetryStrategy} from "../src/autonomy/retry";
import {NoProgressRecovery} from "../src/autonomy/recovery";
import {ApprovalStore} from "../src/safety-v2/approval-store";
import {AuthorizationService} from "../src/safety-v2/authorization";
import {DestructiveCommandClassifier} from "../src/safety-v2/classifier";
import {RuntimeBudgetGuard} from "../src/safety-v2/budget-guard";
import {getSandboxProfile} from "../src/safety-v2/sandbox";
import {maskSecrets} from "../src/safety-v2/secrets";
import {MemoryV2Service} from "../src/memory-v2/service";
import {inferSpecialties} from "../src/memory-v2/specialization";
import {IntegrationActionRouter} from "../src/integrations-v2/router";
import {IntegrationWatchStore} from "../src/integrations-v2/watch-store";
import {DistributedManager} from "../src/distributed/manager";
import {DistributedScheduler} from "../src/distributed/scheduler";
import {DistributedLogStore} from "../src/distributed/log-store";
import {ArtifactTransferService} from "../src/distributed/artifacts";
import {PrerequisiteDetector} from "../src/installer/prerequisites";
import {ProviderInstaller} from "../src/installer/provider-installer";
import {VersionDetector} from "../src/installer/version-detector";
import {StagedUpdater} from "../src/installer/updater-v2";
import {FirstRunDiagnostics} from "../src/desktop/diagnostics";
import {desktopRuntimeInfo} from "../src/desktop/runtime";
import {PluginManagerV2} from "../src/plugins-v2/manager";
import {GovernanceStore} from "../src/governance/store";
import {GovernanceAuthorization} from "../src/governance/authorization";
import {GovernanceAuditChain} from "../src/governance/audit-chain";
import {ReleaseGovernanceService} from "../src/governance/release-governance";
import {StableAcceptanceBinder} from "../src/governance/stable-acceptance";
import {StateMigrationService} from "../src/reproducibility/migrations";
import {ProvenanceStore} from "../src/reproducibility/provenance";
import {IntegrationRegistry,McpManager} from "../src/integrations/registry";
import type {IntegrationId,McpServerConfig} from "../src/integrations/types";
import {postWebhook} from "../src/integrations/webhook";
import {WorkerRegistry} from "../src/workers/registry";
import {WorkerPool} from "../src/workers/pool";
import type {WorkerConfig} from "../src/workers/types";
import {SessionReplayStore} from "../src/replay/store";
import {DisasterRecoveryService} from "../src/recovery/backup";
import {getKitEngineSnapshot,getProjectKitResolution,validateKitEngine,createKitEngine} from "./kit-engine-runtime";
import {universalProviderSnapshot,universalProviderRoute,universalProviderExecute,universalProviderStream,cancelUniversalProviderStream,subscribeUniversalProviderStream} from "./provider-universal-runtime";
import {providerAssignmentSnapshot,setAgentProviderPin,removeAgentProviderPin,saveProviderPolicy,routeWithPolicy} from "./provider-policy-runtime";
import {credentialSnapshot,saveProviderCredential,deleteProviderCredential,applySecureCredentialsToProcess} from "./provider-credential-runtime";
import {testProviderConnection} from "./provider-connection-test";
import {planAutonomousProviderMission} from "./autonomous-provider-orchestrator";
import {accountConnectionSnapshot,launchAccountLogin,accountConnectionStatus} from "./account-connection-runtime";
import {getAutonomousExecutionLoop} from "./autonomous-execution-loop";
import {missionHistory,missionHistoryItem} from "./mission-history-runtime";
import {adaptiveRoutingSnapshot,evidenceList,evidenceItem,approvalInbox,decideApproval,missionReplay} from "./adaptive-evidence-runtime";
import {inspectProjectDocs,bootstrapDocs,recordProgress} from "./project-intelligence-runtime";
import {executeRealProjectMission} from "./real-project-execution-runtime";
import {desktopRuntimeStatus} from "./desktop-runtime-status";
import {integrationReadiness,integrationHistory,recordIntegrationMessage} from "./integration-runtime";
import {callMeReadinessSnapshot,executeCallMeValidation} from "./callme-validation-runtime";
import {createBackup,restoreBackup,runtimeMigration,upgradeCompatibility,getLastKnownGood,saveLastKnownGood} from "./recovery-runtime";
import {rcSecuritySnapshot} from "./security-release-runtime";
import {currentFinalAcceptance,versionConsistency,packageIntegrity,updateFinalAcceptance} from "./final-acceptance-runtime";
import {historyForClient} from "../src/lib/inbox-attention";

const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) loadEnvFile(envLocal);

const port = Number(process.env.OFFICE_BRIDGE_PORT ?? 8787);
const dataRoot =
  process.env.OFFICE_DATA_DIR ||
  (process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "AI-Development-Office")
    : path.join(os.homedir(), ".ai-development-office"));

fs.mkdirSync(dataRoot, { recursive: true });

const projectsFile = path.join(dataRoot, "projects.json");
const historyFile = path.join(dataRoot, "command-history.json");
const settingsFile = path.join(dataRoot, "settings.json");
const auditFile=path.join(dataRoot,"audit-trail.jsonl");

for (const [oldName, target] of [
  ["office.projects.json", projectsFile],
  ["office.command-history.json", historyFile],
] as const) {
  const old = path.resolve(process.cwd(), oldName);
  if (!fs.existsSync(target) && fs.existsSync(old)) fs.copyFileSync(old, target);
}

type Provider = "auto" | "cursor" | "claude";
type ActiveProvider = "cursor" | "claude";
type Project = { id:string; name:string; path:string; enabled:boolean; provider?:Provider; runnerTrusted?:boolean };
type CommandHistory = {
  id:string; projectId:string; projectPath:string; command:string; status:string;
  createdAt:string; startedAt?:string|null; completedAt?:string|null;
  provider?:string|null; message?:string|null;
  findingId?:string|null; findingTitle?:string|null; assignedRole?:string|null;
  queueGroupId?:string|null; queueSequence?:number|null; attempt?:number|null;
  workItemId?:string|null; workItemTitle?:string|null; workItemType?:string|null;
  requiresPlan?:boolean; planPath?:string|null; planSummary?:string|null; plannedAt?:string|null;
  executionLane?:string|null; sprintId?:string|null; sprintLabel?:string|null;
  dependencyIds?:string[]; blockedBy?:string[];
  qualityGateStatus?:"not_required"|"pending"|"execution_passed"|"pending_reaudit"|"verified"|"failed";
  taskReportPath?:string|null;
  leadRole?:string|null; collaboratorRoles?:string[]; collaboratorCodingRoles?:string[];
  verifierStatus?:"not_required"|"pending"|"passed"|"failed"|"error";
  verifierReportPath?:string|null;
  driftStatus?:"not_checked"|"clean"|"detected"; driftSummary?:string|null;
  collaboratorStatus?:Record<string,"pending"|"passed"|"blocked"|"error">;
  collaboratorReportPaths?:Record<string,string>;
  collaboratorSummary?:string|null;
  executionMode?:"solo"|"collaborative"|"competitive";
  isolationStatus?:"not_required"|"pending"|"ready"|"failed";
  worktreePaths?:Record<string,string>;
  mergeGateStatus?:"not_required"|"pending"|"passed"|"blocked"|"applied"|"failed";
  mergeGateSummary?:string|null;
  conflictFiles?:string[];
  competitiveWinner?:"cursor"|"claude"|null;
  competitiveSummary?:string|null;
  subtaskContractPath?:string|null; ownedFiles?:string[];
  ownershipStatus?:"not_required"|"ready"|"conflict"|"failed";
  ownershipConflicts?:string[];
  recoveryState?:"none"|"recoverable"|"recovered"|"discarded";
  inboxDismissed?:boolean;
};
type ScheduledAudit={id:string;projectId:string;label:string;command:string;cadence:"off"|"daily"|"weekly";enabled:boolean;nextRunAt?:string|null;lastRunAt?:string|null};
type OfficeThemeId="classic-cc0"|"pixel-office-32"|"luxury-office"|"modern-corporate"|"call-center"|"top-down-corporate"|"office-hell";
type Settings = {
  agentNames?:Record<string,string>;
  agentNamesByProject?:Record<string,Record<string,string>>;
  defaultProvider:Provider;
  scheduledAudits?:ScheduledAudit[];
  skillPolicyByProject?:Record<string,Record<string,boolean>>;
  retention?:{reportsDays:number;auditDays:number;worktreeDays:number};
  officeTheme?:OfficeThemeId;
  onboardingComplete?:boolean;
};

function slug(value:string){
  return value.replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase()||"project";
}
function readJson<T>(file:string,fallback:T):T{try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return fallback;}}
function saveJson(file:string,value:unknown){fs.writeFileSync(file,JSON.stringify(value,null,2));}

function defaultProjects():Project[]{
  const first=process.env.OFFICE_PROJECT_PATH;
  return first?[{id:slug(path.basename(first)),name:path.basename(first),path:path.resolve(first),enabled:true,provider:"auto",runnerTrusted:false}]:[];
}
let projects=readJson<Project[]>(projectsFile,defaultProjects()).map(p=>({...p,provider:p.provider||"auto",runnerTrusted:!!p.runnerTrusted}));
if(!fs.existsSync(projectsFile))saveJson(projectsFile,projects);
let commandHistory=readJson<CommandHistory[]>(historyFile,[]);
let settings=readJson<Settings>(settingsFile,{
  defaultProvider:"auto",
  agentNamesByProject:{},
  scheduledAudits:[],
  skillPolicyByProject:{},
  retention:{reportsDays:30,auditDays:90,worktreeDays:7},
  officeTheme:"classic-cc0"
});
settings.skillPolicyByProject=settings.skillPolicyByProject||{};
settings.retention=settings.retention||{reportsDays:30,auditDays:90,worktreeDays:7};
settings.officeTheme=settings.officeTheme||"classic-cc0";
settings.scheduledAudits=settings.scheduledAudits||[];
if(settings.onboardingComplete==null&&projects.length>0)settings.onboardingComplete=true;
const legacyAgentNames=settings.agentNames||{};
settings.agentNamesByProject=settings.agentNamesByProject||{};
for(const p of projects){
  settings.agentNamesByProject[p.id]={
    ceo:"CEO",pm:"PM",architect:"Architect",backend:"Backend",frontend:"Frontend",
    database:"Database",qa:"QA",security:"Security",devops:"DevOps",docs:"Docs",
    ...legacyAgentNames,
    ...(settings.agentNamesByProject[p.id]||{})
  };
}
delete settings.agentNames;
function onboardingSnapshot(){
  const complete=!!settings.onboardingComplete||projects.length>0;
  if(complete&&!settings.onboardingComplete){
    settings.onboardingComplete=true;
    saveJson(settingsFile,settings);
  }
  return {complete};
}
saveJson(settingsFile,settings);


// Durable queue recovery: an Office restart must not lose order.
// Previously running work is re-queued at the same sequence so the agent inspects
// existing partial changes and continues/re-validates before later work proceeds.
let recoveredQueue=false;
for(const item of commandHistory){
  if(item.status==="running"||item.status==="planning"||item.status==="verifying"){
    item.status="queued";
    item.attempt=(item.attempt||1)+1;
    item.message="Recovered after Office restart; inspect existing changes and continue safely.";
    item.recoveryState="recoverable";
    item.startedAt=null;
    recoveredQueue=true;
  }
}
if(recoveredQueue)saveJson(historyFile,commandHistory);

applySecureCredentialsToProcess();

const wss=new WebSocketServer({port});
const watchers=new Map<string,fs.FSWatcher>();
const eventOffsets=new Map<string,number>();
// v0.12: role-lane scheduler. One active item per lane, several lanes in parallel.
const MAX_PARALLEL_RUNNERS=Math.max(1,Math.min(8,Number(process.env.OFFICE_MAX_PARALLEL_RUNNERS||3)));
const activeLaneItems=new Map<string,string>();
const activeItemProviders=new Map<string,ActiveProvider>();

// Kept as compatibility snapshots for older UI/event payloads.
let runnerBusy=false;
let runningCommandId:string|null=null;
let activeProvider:ActiveProvider|null=null;

function refreshRunnerCompatibility(){
  const entries=[...activeLaneItems.entries()];
  runnerBusy=entries.length>0;
  runningCommandId=entries[0]?.[1]||null;
  activeProvider=runningCommandId?activeItemProviders.get(runningCommandId)||null:null;
}
function claimLane(item:CommandHistory,provider:ActiveProvider){
  const lane=laneFor(item);
  if(activeLaneItems.has(lane))return false;
  activeLaneItems.set(lane,item.id);
  activeItemProviders.set(item.id,provider);
  item.executionLane=lane;
  refreshRunnerCompatibility();
  return true;
}
function releaseLane(item:CommandHistory){
  const lane=laneFor(item);
  if(activeLaneItems.get(lane)===item.id)activeLaneItems.delete(lane);
  activeItemProviders.delete(item.id);
  refreshRunnerCompatibility();
}


function versionOf(exe:string, provider:ActiveProvider):string|null{
  try{
    const ps=process.platform==="win32"?"powershell.exe":"sh";
    const args=process.platform==="win32"
      ? ["-NoProfile","-NonInteractive","-Command",`& '${exe.replace(/'/g,"''")}' --version`]
      : ["-lc",`"${exe.replace(/"/g,'\\"')}" --version`];
    const r=spawnSync(ps,args,{encoding:"utf8",windowsHide:true,timeout:5000});
    if(r.status===0)return (r.stdout||r.stderr).trim().split(/\r?\n/)[0]||null;
  }catch{}
  return null;
}

function whereExecutable(name:string):string|null{
  try{
    const cmd=process.platform==="win32"?"where.exe":"which";
    const r=spawnSync(cmd,[name],{encoding:"utf8",windowsHide:true,timeout:3000});
    if(r.status===0)return r.stdout.split(/\r?\n/).find(Boolean)?.trim()||null;
  }catch{}
  return null;
}

function findCursor():string|null{
  const candidates:string[]=[];
  if(process.platform==="win32"){
    if(process.env.LOCALAPPDATA)candidates.push(path.join(process.env.LOCALAPPDATA,"cursor-agent","agent.cmd"));
    if(process.env.USERPROFILE)candidates.push(path.join(process.env.USERPROFILE,"AppData","Local","cursor-agent","agent.cmd"));
  }
  const found=whereExecutable("agent");
  if(found)candidates.unshift(found);
  return candidates.find(p=>fs.existsSync(p))||null;
}

function findClaude():string|null{
  const candidates:string[]=[];
  if(process.platform==="win32"&&process.env.USERPROFILE){
    candidates.push(path.join(process.env.USERPROFILE,".local","bin","claude.exe"));
  }
  const found=whereExecutable("claude");
  if(found)candidates.unshift(found);
  return candidates.find(p=>fs.existsSync(p))||null;
}

function providerSnapshot(provider:ActiveProvider){
  const exe=provider==="cursor"?findCursor():findClaude();
  return {
    available:!!exe,
    executable:exe,
    version:exe?versionOf(exe,provider):null,
    message:exe?`${provider} CLI ready`:`${provider} CLI not found`,
  };
}

type ProviderSnapshot=ReturnType<typeof providerSnapshot>;
let providerCache:{cursor:ProviderSnapshot;claude:ProviderSnapshot;at:number}|null=null;
const PROVIDER_CACHE_MS=30_000;

function cachedProviders(){
  if(providerCache&&Date.now()-providerCache.at<PROVIDER_CACHE_MS)return providerCache;
  const cursor=providerSnapshot("cursor");
  const claude=providerSnapshot("claude");
  providerCache={cursor,claude,at:Date.now()};
  return providerCache;
}

function resolveProvider(project:Project):ActiveProvider|null{
  const {cursor,claude}=cachedProviders();
  const wanted=project.provider||settings.defaultProvider||"auto";
  if(wanted==="cursor")return cursor.available?"cursor":null;
  if(wanted==="claude")return claude.available?"claude":null;
  if(cursor.available)return "cursor";
  if(claude.available)return "claude";
  return null;
}

function runnerStatus(projectId?:string){
  const {cursor,claude}=cachedProviders();
  const project=projects.find(p=>p.id===projectId);
  const selectedProvider=(project?.provider||settings.defaultProvider||"auto") as Provider;
  return {
    available:cursor.available||claude.available,
    selectedProvider,
    activeProvider,
    runningCommandId,
    parallel:{
      max:MAX_PARALLEL_RUNNERS,
      active:activeLaneItems.size,
      lanes:[...activeLaneItems.entries()].map(([lane,commandId])=>({
        lane,commandId,provider:activeItemProviders.get(commandId)||null
      }))
    },
    providers:{cursor,claude}
  };
}


function auditLog(projectId:string|null,actor:string,action:string,subject:string|null,outcome:"info"|"success"|"blocked"|"error",message:string){
  const entry={id:crypto.randomUUID(),timestamp:new Date().toISOString(),projectId,actor,action,subject,outcome,message};
  fs.appendFileSync(auditFile,JSON.stringify(entry)+"\n"); return entry;
}
function readAuditTrail(limit=250){try{return fs.readFileSync(auditFile,"utf8").split(/\r?\n/).filter(Boolean).slice(-limit).reverse().map(line=>JSON.parse(line));}catch{return [];}}
function pushAuditTrail(){broadcast({type:"audit_trail",data:readAuditTrail()});}
function contractDirectory(project:Project){const dir=path.join(project.path,".ai-kit","office-subtask-contracts");fs.mkdirSync(dir,{recursive:true});return dir;}
function extractPlanPaths(plan:string){
  const rx=/([A-Za-z0-9_.@/-]+\.(?:ts|tsx|js|jsx|php|json|md|sql|yml|yaml|css|scss|vue|py|go|rs))/gim,out=new Set<string>();let m:RegExpExecArray|null;
  while((m=rx.exec(plan)))out.add(m[1].replace(/\\/g,"/").replace(/^\.?\//,""));
  return [...out].filter(x=>!x.startsWith("node_modules/")).slice(0,40);
}
function buildSubtaskContract(item:CommandHistory,project:Project){
  let plan="";try{if(item.planPath)plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");}catch{}
  const owned=extractPlanPaths(plan);
  const acceptance=plan.split(/\r?\n/).map(x=>x.trim()).filter(x=>/accept|test|verify|validation|must|should/i.test(x)).slice(0,12);
  const contract={version:1,projectId:project.id,commandId:item.id,taskId:item.workItemId||item.findingId||item.command,
    role:item.leadRole||item.assignedRole||"appropriate specialist",executionMode:item.executionMode||"solo",allowedFiles:owned,
    forbiddenFiles:[".git/**","node_modules/**",".env*","vendor/**"],acceptance:acceptance.length?acceptance:["Follow approved plan and pass its listed validation."],
    dependencies:item.dependencyIds||[],deliverables:["implementation","relevant validation/tests","evidence-backed state update"],generatedAt:new Date().toISOString()};
  const file=path.join(contractDirectory(project),`${item.id}.json`);fs.writeFileSync(file,JSON.stringify(contract,null,2));
  item.subtaskContractPath=path.relative(project.path,file).replace(/\\/g,"/");item.ownedFiles=owned;item.ownershipStatus=owned.length?"ready":"not_required";return contract;
}
function readSubtaskContract(item:CommandHistory,project:Project){if(!item.subtaskContractPath)return null;try{return JSON.parse(fs.readFileSync(path.join(project.path,item.subtaskContractPath),"utf8"));}catch{return null;}}
function pathOwned(allowed:string[],file:string){if(!allowed.length)return true;const f=file.replace(/\\/g,"/");return allowed.some(rule=>{const r=rule.replace(/\\/g,"/");return r.endsWith("/**")?f.startsWith(r.slice(0,-3)):f===r;});}
function enforceContractFiles(item:CommandHistory,project:Project,files:string[]){
  const contract=readSubtaskContract(item,project);if(!contract||!Array.isArray(contract.allowedFiles)||!contract.allowedFiles.length)return {ok:true,violations:[] as string[]};
  const violations=files.filter(file=>!pathOwned(contract.allowedFiles,file));return {ok:violations.length===0,violations};
}
function ownershipConflicts(item:CommandHistory){
  const mine=item.ownedFiles||[];if(!mine.length)return [] as string[];const conflicts:string[]=[];
  for(const other of commandHistory){
    if(other.id===item.id||other.projectId!==item.projectId)continue;
    const otherActive=["planning","plan_ready","running","verifying"].includes(other.status);
    const earlierQueued=["queued","waiting_for_agent"].includes(other.status)&&Number(other.queueSequence||0)<Number(item.queueSequence||0);
    if(!otherActive&&!earlierQueued)continue;
    for(const file of mine)if((other.ownedFiles||[]).includes(file))conflicts.push(`${file} owned by ${other.workItemId||other.findingId||other.id}`);
  }
  return [...new Set(conflicts)];
}
function isActiveRecovery(c:CommandHistory){
  const active=["queued","waiting_for_agent","planning","plan_ready","running","verifying"].includes(c.status);
  if(!active)return false;
  return c.recoveryState==="recoverable"||/Recovered after Office restart/i.test(String(c.message||""));
}
function recoverySnapshot(){
  const interrupted=commandHistory.filter(isActiveRecovery)
    .map(c=>({id:c.id,projectId:c.projectId,title:c.workItemTitle||c.findingTitle||c.command,status:c.status,message:c.message}));
  const staleWorktrees:any[]=[];const base=path.join(dataRoot,"worktrees");
  if(fs.existsSync(base))for(const projectDir of fs.readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory())){const pp=path.join(base,projectDir.name);
    for(const cmdDir of fs.readdirSync(pp,{withFileTypes:true}).filter(x=>x.isDirectory())){const commandId=cmdDir.name;const active=commandHistory.some(c=>c.id===commandId&&["planning","plan_ready","queued","running","verifying","waiting_for_agent"].includes(c.status));if(!active)staleWorktrees.push({projectId:projectDir.name,commandId,path:path.join(pp,commandId)});}}
  const rollbackRisks=commandHistory.filter(c=>(c.conflictFiles||[]).includes("ROLLBACK_FAILED")).map(c=>({id:c.id,projectId:c.projectId,summary:c.mergeGateSummary||"Rollback failed"}));
  return {generatedAt:new Date().toISOString(),interrupted,staleWorktrees,rollbackRisks};
}
function cleanupStaleWorktrees(){const snapshot=recoverySnapshot();for(const wt of snapshot.staleWorktrees)safeRemoveDir(wt.path);auditLog(null,"Recovery Manager","cleanup_stale_worktrees",null,"success",`Removed ${snapshot.staleWorktrees.length} stale worktree group(s).`);return recoverySnapshot();}
function recoverInterruptedCommand(id:string){const item=commandHistory.find(c=>c.id===id);if(!item)throw new Error("Command not found.");item.status="queued";item.recoveryState="recovered";item.message="Recovery Manager resumed interrupted command.";item.startedAt=null;item.completedAt=null;saveJson(historyFile,commandHistory);auditLog(item.projectId,"Recovery Manager","resume",item.workItemId||item.findingId||item.command,"success","Interrupted command re-queued.");pushAuditTrail();pushHistory();processQueue();}
function discardInterruptedCommand(id:string){const item=commandHistory.find(c=>c.id===id);if(!item)throw new Error("Command not found.");item.status="cancelled";item.recoveryState="discarded";item.message="Recovery Manager discarded interrupted command; project files were not deleted.";item.completedAt=new Date().toISOString();saveJson(historyFile,commandHistory);auditLog(item.projectId,"Recovery Manager","discard",item.workItemId||item.findingId||item.command,"blocked","Interrupted command discarded without deleting project files.");pushAuditTrail();pushHistory();}

function releaseGateSnapshot(project:Project){
  const state=readState(project),commands=commandHistory.filter(c=>c.projectId===project.id);
  const active=commands.filter(c=>["queued","planning","plan_ready","waiting_for_agent","running","verifying"].includes(c.status)).length;
  const failed=commands.filter(c=>c.qualityGateStatus==="failed"||c.verifierStatus==="failed"||c.verifierStatus==="error").length;
  const openBlockers=(state?.findings||[]).filter((f:any)=>f.status!=="fixed"&&(f.severity==="BLOCKER"||f.severity==="HIGH")).length,dirty=dirtyMainFiles(project);
  const checks=[{id:"active",label:"No active execution",ok:active===0,value:String(active)},{id:"failed",label:"No failed quality gates",ok:failed===0,value:String(failed)},
    {id:"blockers",label:"No blocker/high findings",ok:openBlockers===0,value:String(openBlockers)},{id:"dirty",label:"Working tree is clean",ok:dirty.length===0,value:dirty.length?`${dirty.length} uncommitted change(s)`:"clean"},
    {id:"rollback",label:"No rollback risk",ok:!commands.some(c=>(c.conflictFiles||[]).includes("ROLLBACK_FAILED")),value:"checked"}];
  return {projectId:project.id,generatedAt:new Date().toISOString(),ready:checks.every(x=>x.ok),checks};
}
function doctorSnapshot(project:Project){
  const checks:any[]=[];const push=(id:string,label:string,status:"pass"|"warn"|"fail",detail:string)=>checks.push({id,label,status,detail});
  push("project","Project path",fs.existsSync(project.path)?"pass":"fail",project.path);const git=isGitProject(project);push("git","Git repository",git?"pass":"warn",git?"ready":"not a Git working tree");
  const cursor=findCursor(),claude=findClaude();push("cursor","Cursor CLI",cursor?"pass":"warn",cursor||"not found");push("claude","Claude CLI",claude?"pass":"warn",claude||"not found");
  const node=spawnSync(process.execPath,["--version"],{encoding:"utf8"});push("node","Node runtime",node.status===0?"pass":"fail",String(node.stdout||node.stderr).trim());
  const ai=path.join(project.path,".ai-kit");push("aikit",".ai-kit state",fs.existsSync(ai)?"pass":"warn",fs.existsSync(ai)?ai:"missing");
  const stale=recoverySnapshot().staleWorktrees.filter(x=>x.projectId===slug(project.id)||x.projectId===project.id).length;push("worktrees","Stale worktrees",stale===0?"pass":"warn",String(stale));
  const skills=skillsSnapshot(project);const parityMissing=skills.entries.filter((x:any)=>x.sources.includes("cursor")!==x.sources.includes("claude")).length;push("skills","Cursor/Claude skill parity",parityMissing===0?"pass":"warn",`${parityMissing} asymmetric skill(s)`);
  const overall=checks.some(x=>x.status==="fail")?"critical":checks.some(x=>x.status==="warn")?"warning":"healthy";return {projectId:project.id,generatedAt:new Date().toISOString(),overall,checks};
}

function backupDirectory(){const dir=path.join(dataRoot,"backups");fs.mkdirSync(dir,{recursive:true});return dir;}
function exportOfficeBackup(){
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  const file=path.join(backupDirectory(),`ai-development-office-backup-${stamp}.json`);
  const audit=readAuditTrail(10000);
  const payload={
    format:"ai-development-office-backup",
    version:"1.0.0",
    generatedAt:new Date().toISOString(),
    projects,
    settings:{
      defaultProvider:settings.defaultProvider,
      agentNamesByProject:settings.agentNamesByProject||{},
      scheduledAudits:settings.scheduledAudits||[],
      skillPolicyByProject:settings.skillPolicyByProject||{},
      retention:settings.retention
    },
    commandHistory,
    auditTrail:audit
  };
  fs.writeFileSync(file,JSON.stringify(payload,null,2),"utf8");
  auditLog(null,"Backup","export",null,"success",`Office backup exported to ${file}`);
  pushAuditTrail();
  return {generatedAt:payload.generatedAt,path:file,projects:projects.length,commands:commandHistory.length,auditEntries:audit.length};
}
function currentBranch(project:Project){const r=gitRun(project.path,["branch","--show-current"],8000);return r.ok?r.stdout.trim():"";}
function safeReleaseBranchName(project:Project){
  const stamp=new Date().toISOString().slice(0,16).replace(/[-:T]/g,"");
  return `office/release-${slug(project.name)}-${stamp}`;
}
function runReleaseAction(projectId:string,action:"branch"|"commit"|"pr"|"leave_uncommitted",message?:string){
  const project=projects.find(p=>p.id===projectId);if(!project)return {projectId,action,ok:false,message:"Project not found.",branch:null,output:null};
  const gate=releaseGateSnapshot(project);
  if(!gate.ready)return {projectId,action,ok:false,message:"Release Gate is not ready.",branch:currentBranch(project)||null,output:null};
  if(!isGitProject(project)&&action!=="leave_uncommitted")return {projectId,action,ok:false,message:"Git repository required.",branch:null,output:null};

  if(action==="leave_uncommitted"){
    auditLog(project.id,"Release","leave_uncommitted",project.name,"success","Release-ready changes intentionally left uncommitted.");
    pushAuditTrail();
    return {projectId,action,ok:true,message:"Changes left uncommitted by explicit user choice.",branch:currentBranch(project)||null,output:null};
  }
  if(action==="branch"){
    const branch=safeReleaseBranchName(project),r=gitRun(project.path,["switch","-c",branch],15000);
    const ok=r.ok;auditLog(project.id,"Release","create_branch",project.name,ok?"success":"error",ok?`Created ${branch}`:(r.stderr||r.stdout));pushAuditTrail();
    return {projectId,action,ok,message:ok?`Created release branch ${branch}`:"Could not create release branch.",branch:ok?branch:currentBranch(project)||null,output:r.stderr||r.stdout};
  }
  if(action==="commit"){
    const dirty=dirtyMainFiles(project);
    if(!dirty.length)return {projectId,action,ok:false,message:"No releasable working-tree changes to commit.",branch:currentBranch(project)||null,output:null};
    const add=gitRun(project.path,["add","-A"],15000);
    if(!add.ok)return {projectId,action,ok:false,message:"git add failed.",branch:currentBranch(project)||null,output:add.stderr||add.stdout};
    const commitMessage=(message||"chore: AI Development Office verified release").trim().slice(0,180);
    const commit=gitRun(project.path,["commit","-m",commitMessage],30000);
    const ok=commit.ok;auditLog(project.id,"Release","create_commit",project.name,ok?"success":"error",ok?commitMessage:(commit.stderr||commit.stdout));pushAuditTrail();
    return {projectId,action,ok,message:ok?"Verified changes committed.":"Commit failed.",branch:currentBranch(project)||null,output:commit.stderr||commit.stdout};
  }
  const gh=whereExecutable("gh");
  if(!gh)return {projectId,action,ok:false,message:"GitHub CLI (gh) not found.",branch:currentBranch(project)||null,output:null};
  const branch=currentBranch(project);
  if(!branch)return {projectId,action,ok:false,message:"No current Git branch.",branch:null,output:null};
  const status=gitRun(project.path,["status","--porcelain"],10000);
  if(status.stdout.trim())return {projectId,action,ok:false,message:"Commit changes before creating a PR.",branch,output:null};
  const push=gitRun(project.path,["push","-u","origin",branch],60000);
  if(!push.ok)return {projectId,action,ok:false,message:"Could not push release branch.",branch,output:push.stderr||push.stdout};
  const pr=spawnSync(gh,["pr","create","--fill"],{cwd:project.path,encoding:"utf8",windowsHide:true,timeout:60000});
  const ok=pr.status===0,output=String(pr.stdout||pr.stderr||"").trim();
  auditLog(project.id,"Release","create_pr",project.name,ok?"success":"error",output||"gh pr create");pushAuditTrail();
  return {projectId,action,ok,message:ok?"Pull request created.":"Pull request creation failed.",branch,output};
}

function retentionCleanup(){
  const now=Date.now(),ret=settings.retention!,removeOld=(dir:string,days:number)=>{if(!fs.existsSync(dir))return 0;let count=0,cutoff=now-days*86400000;for(const file of fs.readdirSync(dir)){const full=path.join(dir,file);try{const st=fs.statSync(full);if(st.mtimeMs<cutoff){fs.rmSync(full,{recursive:true,force:true});count++;}}catch{}}return count;};
  let removed=0;
  for(const project of projects){
    removed+=removeOld(path.join(project.path,".ai-kit","task-reports"),ret.reportsDays);
    removed+=removeOld(path.join(project.path,".ai-kit","office-verifications"),ret.reportsDays);
    removed+=removeOld(path.join(project.path,".ai-kit","office-collaboration"),ret.reportsDays);
  }
  const staleCutoff=now-ret.worktreeDays*86400000;
  for(const wt of recoverySnapshot().staleWorktrees){
    try{if(fs.statSync(wt.path).mtimeMs<staleCutoff){safeRemoveDir(wt.path);removed++;}}catch{}
  }
  const entries=readAuditTrail(10000),cutoff=now-ret.auditDays*86400000,kept=entries.filter((x:any)=>Date.parse(x.timestamp)>=cutoff).reverse();
  fs.writeFileSync(auditFile,kept.map((x:any)=>JSON.stringify(x)).join("\n")+(kept.length?"\n":""));
  auditLog(null,"Retention","cleanup",null,"success",`Removed ${removed} old artifact(s); retained ${kept.length} audit entries.`);
  return {removed,auditEntries:kept.length};
}

function broadcast(payload:unknown){const data=JSON.stringify(payload);for(const c of wss.clients)if(c.readyState===WebSocket.OPEN)c.send(data);}
const disasterRecovery=new DisasterRecoveryService();
const replayStore=new SessionReplayStore();
const workerPool=new WorkerPool();
const workerRegistry=new WorkerRegistry();
const mcpManager=new McpManager();
const integrationRegistry=new IntegrationRegistry();
const provenanceStore=new ProvenanceStore();
const migrationService=new StateMigrationService();
const stableAcceptanceBinder=new StableAcceptanceBinder();
const releaseGovernance=new ReleaseGovernanceService();
const governanceAudit=new GovernanceAuditChain();
const governanceAuth=new GovernanceAuthorization();
const governanceStore=new GovernanceStore();
const pluginManagerV2=new PluginManagerV2(process.cwd());
const providerInstallerV2=new ProviderInstaller();
const prerequisiteDetectorV2=new PrerequisiteDetector();
const versionDetectorV2=new VersionDetector();
const firstRunDiagnostics=new FirstRunDiagnostics();
const updaterV2=new StagedUpdater(path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),"AppData","Local"),"AI-Development-Office"));
const artifactTransfer=new ArtifactTransferService();
const distributedLogs=new DistributedLogStore();
const distributedScheduler=new DistributedScheduler();
const distributedManager=new DistributedManager();
const integrationWatchStore=new IntegrationWatchStore();
const integrationActionRouter=new IntegrationActionRouter();
const memoryV2=new MemoryV2Service();
const runtimeBudgetGuard=new RuntimeBudgetGuard();
const commandClassifier=new DestructiveCommandClassifier();
const authorizationService=new AuthorizationService();
const approvalStore=new ApprovalStore();
const noProgressRecovery=new NoProgressRecovery();
const intelligentRetry=new IntelligentRetryStrategy();
const autonomousRouter=new AutonomousRouter();
const dynamicTeamBuilder=new DynamicTeamBuilder();
const agentScoring=new AgentScoringService();
const mergeAssistant=new MergeConflictAssistant();
const autoGitPolicy=new AutoGitPolicyStore();
const gitIntelligence=new GitIntelligenceService();
const pluginRegistry=new PluginRegistry();
const ledgerStore=new LedgerStore();
const automationEngine=new AutomationEngine();
const officeUpdater=new OfficeUpdater(packageJson.version);
const providerEngine=new ProviderEngine();
const safety=new SafetyService();
const memory=new MemoryService();
const collaboration=new CollaborationService();
const workspaceService=new WorkspaceService();
const workspaceWatcher=new WorkspaceWatcher();
const runtimeEvents=new RuntimeEventBus(2000);
const runtimeProcesses=new AgentProcessManager(runtimeEvents);
runtimeEvents.subscribe(event=>broadcast({type:"runtime_event",data:event}));
getAutonomousExecutionLoop().subscribe(event=>broadcast({type:"autonomous_mission_event",data:event}));
runtimeEvents.subscribe(event=>{
  try{
    const p=projects.find(x=>x.id===event.projectId);
    if(p)replayStore.append(p.path,event);
  }catch{}
});

runtimeEvents.subscribe(event=>{
  const seed={projectId:event.projectId,agentId:event.agentId};
  if(event.type==="runtime.session.output"){
    const data=String(event.payload.data||"");
    const errorMatch=data.match(/(?:error|exception|failed|fatal)[:\s].*/i);
    if(errorMatch){
      const incident=safety.breaker.recordError(event.sessionId,seed,errorMatch[0].slice(0,500));
      applySafetyIncident(incident);
    }
  }
  if(event.type==="runtime.session.exited"||event.type==="runtime.session.failed"){
    safety.breaker.remove(event.sessionId);
  }
});

function pushRuntimeSessions(projectId?:string){broadcast({type:"runtime_sessions",data:runtimeProcesses.list(projectId)});}
runtimeEvents.subscribe(event=>{
  if(event.type!=="runtime.session.output")pushRuntimeSessions(event.projectId);
});

function runtimeProviderExecutable(provider:RuntimeProvider){
  const launch=providerEngine.buildLaunch(provider as ProviderId,process.cwd(),null);
  return launch.executable;
}






function updateCheck(){return officeUpdater.check(process.cwd());}



function governanceSnapshot(projectId:string){
  const p=officeProject(projectId);
  const stableUnlocked=stableAcceptanceBinder.isUnlocked(p.path);
  return {
    policy:governanceStore.policy(p.id,p.path),
    members:governanceStore.members(p.path),
    decisions:governanceStore.decisions(p.path),
    waivers:governanceStore.waivers(p.path),
    evidence:governanceStore.evidence(p.path),
    signoffs:governanceStore.signoffs(p.path),
    audit:governanceAudit.verify(p.path),
    stableAcceptance:stableAcceptanceBinder.read(p.path),
    release:releaseGovernance.evaluate(p.id,p.path,stableUnlocked)
  };
}
function pluginV2Snapshot(projectId:string){
  const p=officeProject(projectId);
  return pluginManagerV2.snapshot(p.path);
}
function installerSnapshot(){
  return {
    prerequisites:prerequisiteDetectorV2.check(),
    version:versionDetectorV2.current(process.cwd()),
    runtime:desktopRuntimeInfo()
  };
}
function distributedSnapshot(projectId:string){
  const p=officeProject(projectId);
  const workers=workerRegistry.list(p.path);
  return {
    jobs:distributedManager.jobs.list(p.path),
    capabilities:distributedScheduler.capabilities(p.path,workers)
  };
}
function integrationV2Snapshot(projectId:string){
  const p=officeProject(projectId);
  return {audit:integrationActionRouter.auditLog(p.path,300),watches:integrationWatchStore.list(p.path)};
}
function memoryV2Snapshot(projectId:string){
  const p=officeProject(projectId);
  return {records:memoryV2.store.list(p.path)};
}
const DEFAULT_PERMISSION_POLICY={
  network:"ask",providerExecution:"allow",terminalWrite:"ask",terminalTerminate:"ask",filesystemWrite:"ask"
} as const;
function safetyV2Snapshot(projectId:string){
  const p=officeProject(projectId);
  return {approvals:approvalStore.list(p.path),profile:getSandboxProfile("guarded"),permissionPolicy:DEFAULT_PERMISSION_POLICY};
}
function integrationSnapshot(projectId:string){
  const p=officeProject(projectId);
  return {
    configs:integrationRegistry.load(p.path),
    status:integrationRegistry.status(p.path),
    mcpServers:mcpManager.list(p.path)
  };
}

function workerSnapshot(projectId:string){
  const p=officeProject(projectId);
  const configs=workerRegistry.list(p.path);
  return {configs,states:workerPool.states(configs)};
}

function replaySnapshot(projectId:string){
  const p=officeProject(projectId);
  return replayStore.list(p.path);
}
function gitGraphSnapshot(projectId:string,limit=120){
  const p=officeProject(projectId);
  return gitIntelligence.graph(p.path,limit);
}

function gitWorkingTree(projectId:string){
  const p=officeProject(projectId);
  return gitIntelligence.workingTree(p.path);
}

function gitSnapshots(projectId:string){
  const p=officeProject(projectId);
  return gitIntelligence.listSnapshots(p.path);
}

function provenanceSnapshot(projectId:string,limit=500){
  const p=officeProject(projectId);
  return provenanceStore.list(p.path,limit);
}
function automationSnapshot(projectId:string){
  const p=officeProject(projectId);
  return automationEngine.store.load(p.path);
}

function pushAutomation(projectId:string){
  broadcast({type:"automation_snapshot",projectId,data:automationSnapshot(projectId)});
}

function ledgerSnapshot(projectId:string){
  const p=officeProject(projectId);
  return {
    entries:ledgerStore.load(p.path),
    summary:ledgerStore.summary(p.path)
  };
}

function pushLedger(projectId:string){
  broadcast({type:"ledger_snapshot",projectId,data:ledgerSnapshot(projectId)});
}

function pluginSnapshot(){
  return pluginRegistry.discover(process.cwd()).map(p=>({
    id:p.manifest.id,
    name:p.manifest.name,
    version:p.manifest.version,
    description:p.manifest.description,
    permissions:p.manifest.permissions,
    enabled:p.enabled,
    errors:p.errors
  }));
}

async function runAutomationDue(projectId:string){
  const p=officeProject(projectId);
  const results=await automationEngine.runDue(p.id,p.path,async mission=>{
    try{
      const snapshot=spawnRuntimeAgent(
        p.id,
        mission.provider||"auto",
        `mission-${mission.id.slice(0,8)}`,
        mission.role||"general",
        null,
        mission.prompt
      );
      return {ok:true,result:`Spawned runtime session ${snapshot.id}`};
    }catch(error){
      return {ok:false,result:error instanceof Error?error.message:String(error)};
    }
  });
  pushAutomation(projectId);
  return results;
}
function providerHealthSnapshot(){
  return providerEngine.health.snapshot();
}

function refreshProviderHealth(){
  const rows=providerEngine.health.checkAll();
  broadcast({type:"provider_health",data:rows});
  return rows;
}

function providerRoute(task:string,role:string|null,preferred:string|null,localOnly:boolean){
  const preferredId=(preferred&&["cursor","claude","codex","gemini","opencode","local"].includes(preferred))
    ?preferred as ProviderId:null;
  return providerEngine.route({task,role,preferred:preferredId,localOnly});
}
function safetySnapshot(projectId?:string){
  return safety.snapshot(projectId);
}

function pushSafety(projectId?:string){
  broadcast({type:"safety_snapshot",projectId,data:safetySnapshot(projectId)});
}

function applySafetyIncident(incident:any){
  if(!incident)return null;
  safety.addIncident(incident);
  const session=runtimeProcesses.get(String(incident.sessionId||""));
  if(session){
    try{
      if(incident.action==="pause")runtimeProcesses.pause(session.id);
      else if(incident.action==="constrain")runtimeProcesses.constrain(session.id,incident.message);
      else if(incident.action==="stop")runtimeProcesses.terminate(session.id);
    }catch{}
  }
  pushSafety(String(incident.projectId||""));
  return incident;
}

function runtimeSafetySeed(sessionId:string){
  const session=runtimeProcesses.get(sessionId);
  if(!session)throw new Error("Runtime session not found.");
  return {session,seed:{projectId:session.projectId,agentId:session.agentId}};
}
function memorySnapshot(projectId:string){
  const p=officeProject(projectId);
  return memory.snapshot(p.id,p.path);
}

function pushMemory(projectId:string){
}

function memoryAdd(projectId:string,scope:string,agentId:string|null,kind:string,title:string,body:string,tags:string[],relatedTaskId:string|null,relatedArtifactIds:string[],importance:number){
  const p=officeProject(projectId);
  const allowedKinds=new Set(["lesson","decision","fact","warning","handoff","summary","history"]);
  const row=memory.add(p.id,p.path,{
    scope:scope==="agent"?"agent":"shared",
    agentId,
    kind:(allowedKinds.has(kind)?kind:"fact") as any,
    title,
    body,
    tags,
    relatedTaskId,
    relatedArtifactIds,
    importance
  });
  pushMemory(p.id);
  return row;
}

function memorySearch(projectId:string,query:string,agentId:string|null,limit:number){
  const p=officeProject(projectId);
  return memory.search(p.id,p.path,query,agentId,limit);
}

function memoryCondense(projectId:string,maxItems:number,retentionDays:number){
  const p=officeProject(projectId);
  const result=memory.condense(p.id,p.path,maxItems,retentionDays);
  auditLog(p.id,"Memory","condense","memory","info","Memory retention/condensation completed.");
  pushAuditTrail();
  pushMemory(p.id);
  return result;
}
function collaborationSnapshot(projectId:string){
  const p=officeProject(projectId);
  return collaboration.snapshot(p.id,p.path);
}

function pushCollaboration(projectId:string){
  broadcast({type:"collaboration_snapshot",projectId,data:collaborationSnapshot(projectId)});
}

function directorPlan(projectId:string,goal:string){
  const p=officeProject(projectId);
  const roles=["architect","backend","frontend","qa","security","database","devops","general"];
  const memoryContext=memory.directorContext(p.id,p.path,goal);
  const plan=collaboration.createPlan(p.id,p.path,goal,roles);
  if(memoryContext.length){collaboration.store.addBlackboard(p.id,p.path,{authorAgentId:"director",category:"fact",title:"Director memory context",body:memoryContext.map(x=>`[${x.kind}] ${x.title}: ${x.body}`).join("\n"),relatedTaskId:null});}
  auditLog(p.id,"Office Director","plan",goal,"info",`Director created ${plan.tasks.length} tasks.`);
  pushAuditTrail();
  pushCollaboration(p.id);
  return plan;
}

function collaborationMessage(projectId:string,fromAgentId:string,toAgentId:string,subject:string,body:string,relatedTaskId:string|null,artifactIds:string[]){
  const p=officeProject(projectId);
  const row=collaboration.store.sendMessage(p.id,p.path,{fromAgentId,toAgentId,subject,body,relatedTaskId,artifactIds});
  pushCollaboration(p.id);
  return row;
}

function collaborationBlackboard(projectId:string,authorAgentId:string,category:string,title:string,body:string,relatedTaskId:string|null){
  const p=officeProject(projectId);
  const allowed=new Set(["decision","fact","warning","handoff","note"]);
  const row=collaboration.store.addBlackboard(p.id,p.path,{
    authorAgentId,
    category:(allowed.has(category)?category:"note") as any,
    title,body,relatedTaskId
  });
  pushCollaboration(p.id);
  return row;
}

function collaborationArtifact(projectId:string,producerAgentId:string,taskId:string|null,type:string,title:string,payload:Record<string,unknown>){
  const p=officeProject(projectId);
  const allowed=new Set(["file-set","report","diff","test-result","decision","handoff"]);
  const row=collaboration.store.addArtifact(p.id,p.path,{
    producerAgentId,taskId,
    type:(allowed.has(type)?type:"report") as any,
    title,payload
  });
  pushCollaboration(p.id);
  return row;
}
function officeProject(projectId:string){const project=projects.find(p=>p.id===projectId);if(!project)throw new Error("Project not found.");return project;}
function workspaceList(projectId:string,relativePath="",depth=3){const p=officeProject(projectId);return workspaceService.list(p.path,relativePath,depth);}
function workspaceRead(projectId:string,relativePath:string){const p=officeProject(projectId);const payload=workspaceService.read(p.path,relativePath);payload.projectId=p.id;return payload;}
function workspaceWrite(projectId:string,relativePath:string,content:string){const p=officeProject(projectId);if(!p.runnerTrusted)throw new Error("Workspace writes require a trusted project.");const activeSession=runtimeProcesses.list(p.id).find(x=>x.status==="running");
  if(activeSession){
    const incident=safety.breaker.checkProtectedPath(activeSession.id,{projectId:p.id,agentId:activeSession.agentId},relativePath);
    if(incident){applySafetyIncident(incident);throw new Error(incident.message);}
  }
  const result=workspaceService.write(p.path,relativePath,content);auditLog(p.id,"Workspace","write",relativePath,"info","File saved from Office workspace.");pushAuditTrail();return result;}
function workspaceDiff(projectId:string){return workspaceService.gitDiff(officeProject(projectId).path);}
function startWorkspaceWatch(projectId:string){const p=officeProject(projectId);return workspaceWatcher.watch(p.id,p.path,e=>broadcast({type:"workspace_file_event",data:e}));}

function spawnRuntimeAgent(projectId:string,providerInput:string,agentId:string,role:string,resumeToken?:string|null,task?:string|null){
  const project=projects.find(p=>p.id===projectId);
  if(!project)throw new Error("Project not found.");
  if(!project.runnerTrusted)throw new Error("Runtime spawn requires a trusted project.");

  let provider:ProviderId|null=null;
  if(["cursor","claude","codex","gemini","opencode","local"].includes(providerInput)){
    provider=providerInput as ProviderId;
  }else{
    const decision=providerEngine.route({
      task:task||role||"general development task",
      role,
      preferred:null
    });
    provider=decision.selected;
  }

  if(!provider)throw new Error("No healthy provider is available.");
  const launch=providerEngine.buildLaunch(provider,project.path,resumeToken||null);
  const snapshot=runtimeProcesses.spawn({
    projectId:project.id,
    projectPath:project.path,
    agentId:agentId||role||provider,
    role:role||"general",
    provider:provider as RuntimeProvider,
    executable:launch.executable,
    args:launch.args,
    cwd:project.path
  });
  pushRuntimeSessions(project.id);
  return snapshot;
}

function pushProjects(){broadcast({type:"projects",data:projects});}
function pushHistory(){broadcast({type:"command_history",data:historyForClient(commandHistory)});}
function pushRunner(){broadcast({type:"runner_status",data:runnerStatus()});}
function pushNames(){broadcast({type:"agent_names",data:settings.agentNamesByProject||{}});}
function missionSettingsSnapshot(){
  return {
    scheduledAudits:settings.scheduledAudits||[],
    officeTheme:settings.officeTheme||"classic-cc0",
    usageTelemetry:{tokenSource:"unavailable",costSource:"unavailable"}
  };
}
function pushMissionSettings(){broadcast({type:"mission_settings",data:missionSettingsSnapshot()});}



function skillCategory(id:string){
  const first=id.replace(/\\/g,"/").split("/").filter(Boolean)[0]||"other";
  return first.toLowerCase();
}
function collectSkillFiles(base:string,source:"cursor"|"claude"|"kit",project:Project,rows:Map<string,any>){
  if(!fs.existsSync(base))return;
  const stack=[base];
  let scanned=0;
  while(stack.length&&scanned<800){
    const dir=stack.pop()!;scanned++;
    let entries:any[]=[];
    try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{continue;}
    for(const entry of entries){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()){stack.push(full);continue;}
      if(!/^skill\.md$/i.test(entry.name))continue;
      const rel=path.relative(base,path.dirname(full)).replace(/\\/g,"/");
      const id=rel&&rel!=="."?rel:slug(path.basename(path.dirname(full)));
      const key=id.toLowerCase();
      const existing=rows.get(key)||{id,name:id.split("/").pop()||id,category:skillCategory(id),sources:[],paths:[],active:false,enabled:true,agentRoles:[],capabilities:[]};
      if(!existing.sources.includes(source))existing.sources.push(source);
      existing.paths.push(path.relative(project.path,full).replace(/\\/g,"/"));
      rows.set(key,existing);
    }
  }
}
function skillsSnapshot(project:Project){
  const rows=new Map<string,any>();
  collectSkillFiles(path.join(project.path,".cursor","skills"),"cursor",project,rows);
  collectSkillFiles(path.join(project.path,".claude","skills"),"claude",project,rows);
  const embeddedKitRoot=path.resolve(process.cwd(),"engine","ai-development-kit","shared","skills");
  collectSkillFiles(embeddedKitRoot,"kit",project,rows);

  const state=readState(project);
  const agents=Array.isArray(state?.agents)?state.agents:[];
  for(const agent of agents){
    const skill=String(agent.skill||"").trim();
    if(skill){
      const key=skill.toLowerCase();
      const existing=rows.get(key)||{id:skill,name:skill.split("/").pop()||skill,category:skillCategory(skill),sources:["kit"],paths:[],active:false,enabled:true,agentRoles:[],capabilities:[]};
      existing.active=true;
      if(!existing.agentRoles.includes(agent.role))existing.agentRoles.push(agent.role);
      for(const cap of agent.capabilities||[])if(!existing.capabilities.includes(cap))existing.capabilities.push(cap);
      rows.set(key,existing);
    }
  }

  // Capability specialists without an explicit skill still expose their capability in Skills Hub.
  for(const agent of agents){
    for(const cap of agent.capabilities||[]){
      const id=`capability/${cap}`,key=id.toLowerCase();
      const existing=rows.get(key)||{id,name:cap,category:"capability",sources:["kit"],paths:[],active:true,enabled:true,agentRoles:[],capabilities:[cap]};
      existing.active=true;
      if(!existing.agentRoles.includes(agent.role))existing.agentRoles.push(agent.role);
      rows.set(key,existing);
    }
  }

  const policy=settings.skillPolicyByProject?.[project.id]||{};
  for(const entry of rows.values())entry.enabled=policy[entry.id]!==false;
  const entries=[...rows.values()].sort((a,b)=>Number(b.active)-Number(a.active)||Number(b.enabled)-Number(a.enabled)||a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  return {projectId:project.id,generatedAt:new Date().toISOString(),total:entries.length,activeCount:entries.filter(x=>x.active).length,entries};
}
function pushSkills(project:Project){broadcast({type:"skills",data:skillsSnapshot(project)});}


function setSkillEnabled(projectId:string,skillId:string,enabled:boolean){
  const project=projects.find(p=>p.id===projectId);if(!project)throw new Error("Project not found.");
  settings.skillPolicyByProject=settings.skillPolicyByProject||{};
  settings.skillPolicyByProject[projectId]=settings.skillPolicyByProject[projectId]||{};
  settings.skillPolicyByProject[projectId][skillId]=enabled;
  saveJson(settingsFile,settings);
  const ai=path.join(project.path,".ai-kit");fs.mkdirSync(ai,{recursive:true});
  fs.writeFileSync(path.join(ai,"office-skill-policy.json"),JSON.stringify({
    projectId,updatedAt:new Date().toISOString(),skills:settings.skillPolicyByProject[projectId]
  },null,2));
  pushSkills(project);
}
function skillPolicyPrompt(project:Project){
  const policy=settings.skillPolicyByProject?.[project.id]||{};
  const disabled=Object.entries(policy).filter(([,enabled])=>enabled===false).map(([id])=>id);
  if(!disabled.length)return "";
  return `Office skill policy: these skills/capabilities are disabled for this project and must not be intentionally invoked: ${disabled.join(", ")}.`;
}

function emitProjectEvent(project:Project,actorId:string,role:string,eventType:string,status:string,task:string,message:string){
  const file=path.join(project.path,".ai-kit","events.jsonl");
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.appendFileSync(file,JSON.stringify({
    event_id:crypto.randomUUID(),timestamp:new Date().toISOString(),project_id:project.id,
    actor:{id:actorId,role,provider:activeProvider||"office-runner",skill:"office-runner"},
    event_type:eventType,status,task,message
  })+"\n");
}

function roleForFinding(title:string){
  const t=title.toLowerCase();
  if(/security|auth|mfa|secret|token|webhook|idor|permission|owner|oauth|password|credential|cors/.test(t))return["security","Security"];
  if(/test|coverage|phpunit|regression/.test(t))return["qa","QA"];
  if(/database|migration|mysql|postgres|query|tenant/.test(t))return["database","Database"];
  if(/css|ui|inertia|react|frontend/.test(t))return["frontend","Frontend"];
  if(/docker|ci|queue|worker|deploy|s3|ops/.test(t))return["devops","DevOps"];
  return["backend","Backend"];
}



function collaboratorsForWork(type:string,role:string,explicit?:unknown){
  if(Array.isArray(explicit))return [...new Set(explicit.map(String).filter(Boolean).filter(x=>x!==role))];
  // Conservative defaults: QA is a verifier/collaborator for implementation;
  // Security participates only when the work itself is security-sensitive.
  const t=type.toLowerCase();
  const result:string[]=[];
  if(["frontend","backend","database","feature","devops"].includes(t)&&role!=="QA")result.push("QA");
  if(t==="security"&&role!=="Security")result.push("Security");
  return result;
}

function commandRequiresPlan(item:CommandHistory){
  if(item.requiresPlan===false)return false;
  return ["fix next","continue","fix finding","execute work item"].includes(item.command);
}

function planDirectory(project:Project){
  const dir=path.join(project.path,".ai-kit","office-plans");
  fs.mkdirSync(dir,{recursive:true});
  return dir;
}

function planFileFor(project:Project,item:CommandHistory){
  return path.join(planDirectory(project),`${item.id}.md`);
}

function planPromptFor(item:CommandHistory){
  const subject=item.findingId
    ? `${item.findingId} ${item.findingTitle||""}`
    : item.workItemId
      ? `${item.workItemId} ${item.workItemTitle||""}`
      : item.command;

  return [
    "You are in PLANNING ONLY mode for AI Development Office.",
    "Do not modify application code, project files, git state, dependencies, or generated files.",
    `Task: ${subject}.`,
    `Assigned role: ${item.assignedRole||"CEO/appropriate specialist"}.`,
    "Inspect the repository and canonical project docs first.",
    "Produce a concise implementation plan with these exact sections:",
    "1. Problem / goal",
    "2. Evidence inspected",
    "3. Files likely to change",
    "4. Step-by-step implementation",
    "5. Risks / regressions to avoid",
    "6. Tests / validation",
    "7. Acceptance criteria",
    "8. Rollback / stop conditions",
    "Do not implement anything. Return only the plan."
  ].join(" ");
}

function executionPromptWithPlan(item:CommandHistory,plan:string,collaborationContext=""){
  const subject=item.findingId
    ? `${item.findingId} ${item.findingTitle||""}`
    : item.workItemId
      ? `${item.workItemId} ${item.workItemTitle||""}`
      : item.command;

  return [
    "Use the AI Development Kit workflow in this project.",
    `Execute exactly this approved Office task: ${subject}.`,
    `Assigned role: ${item.assignedRole||"appropriate specialist"}.`,
    "Follow the plan below. Re-inspect evidence if repository state changed.",
    "Do not expand scope beyond the plan unless a blocking contradiction is discovered.",
    "If the plan is unsafe or stale, stop and report instead of improvising.",
    "Run the listed relevant tests/validation before completion.",
    "Update canonical state/docs only when evidence supports it.",
    "",
    "APPROVED PLAN:",
    plan,
    "",
    collaborationContext ? "COLLABORATOR PRE-EXECUTION REVIEWS:" : "",
    collaborationContext
  ].filter(Boolean).join("\n");
}

function summarizePlan(plan:string){
  const compact=plan.replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean);
  return compact.slice(0,6).join(" · ").slice(0,420);
}

function promptFor(item:CommandHistory){
  if(item.command==="execute work item"){
    return [
      "Use the AI Development Kit workflow in this project.",
      `Execute exactly this Office work item: ${item.workItemId} ${item.workItemTitle}.`,
      `Work type: ${item.workItemType}. CEO assigned it to ${item.assignedRole||"the appropriate role"}.`,
      "Inspect project docs and actual repository evidence before changing anything.",
      "Do not implement unrelated backlog items.",
      "Run the relevant validation/tests/build for this work item.",
      "Update PROGRESS.md / PROJECT_STATE.md / related docs only when evidence supports completion.",
      "Stop after this one work item."
    ].join(" ");
  }
  if(item.command==="fix finding"){
    return [
      "Use the AI Development Kit workflow in this project.",
      `Fix exactly this verified finding: ${item.findingId} ${item.findingTitle}.`,
      `CEO has assigned this task to ${item.assignedRole}.`,
      "Inspect actual code before changing anything. Implement the smallest correct fix.",
      "Run relevant regression/security tests. Update PROGRESS.md, PROJECT_STATE.md and audit/finding status only after verification.",
      "Do not automatically move to another finding."
    ].join(" ");
  }
  return `Use the AI Development Kit command exactly as if the user typed it in the coding agent: ${item.command}. Follow project instructions and project state.`;
}

function isMutating(item:CommandHistory){
  return isMutatingCommand(item.command);
}

function spawnRunner(provider:ActiveProvider,exe:string,project:Project,prompt:string,mutating:boolean){
  // PowerShell wrapper is deliberate: Cursor installs as agent.cmd on native Windows.
  // Prompt is passed through environment variables, not interpolated into shell source.
  if(process.platform==="win32"){
    const script=provider==="cursor"
      ? `$a=@('-p','--trust','--workspace',$env:OFFICE_PROJECT,'--output-format','text'); if($env:OFFICE_MUTATE -eq '1'){$a+='--force'}; $a+=$env:OFFICE_PROMPT; & $env:OFFICE_EXE @a`
      : `$a=@('-p','--permission-mode','auto',$env:OFFICE_PROMPT); & $env:OFFICE_EXE @a`;
    return spawn("powershell.exe",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-Command",script],{
      cwd:project.path,windowsHide:true,shell:false,
      env:{...process.env,OFFICE_EXE:exe,OFFICE_PROJECT:project.path,OFFICE_PROMPT:prompt,OFFICE_MUTATE:mutating?"1":"0"}
    });
  }

  const args=provider==="cursor"
    ? ["-p","--trust","--workspace",project.path,"--output-format","text",...(mutating?["--force"]:[]),prompt]
    : ["-p","--permission-mode","auto",prompt];
  return spawn(exe,args,{cwd:project.path,shell:false,env:{...process.env}});
}


async function createPlan(item:CommandHistory,project:Project,provider:ActiveProvider,exe:string){
  item.status="planning";
  item.startedAt=item.startedAt||new Date().toISOString();
  item.provider=provider;
  item.message=`${provider} planning only — no code changes allowed`;
  saveJson(historyFile,commandHistory);pushHistory();pushRunner();

  emitProjectEvent(project,"ceo","CEO","task_started","planning",item.command,
    `CEO requested implementation plan for ${item.findingId||item.workItemId||item.command}`);

  emitProjectEvent(project,"architect","Architect","task_started","planning",item.command,
    `Architect planning ${item.findingId||item.workItemId||item.command}`);
  emitProjectEvent(project,"cto","CTO","task_started","planning",item.command,
    `CTO technical planning review`);
  if(item.assignedRole){
    const planningActor=item.assignedRole.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
    emitProjectEvent(project,planningActor,item.assignedRole,"task_started","planning",item.command,
      `Planning meeting with CEO / CTO / Architect`);
  }

  return await new Promise<boolean>((resolve)=>{
    const prompt=planPromptFor(item);
    const child=spawnRunner(provider,exe,project,prompt,false);
    let output="",err="";
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>30000)output=output.slice(-30000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>10000)err=err.slice(-10000);});

    const finish=(ok:boolean,message:string)=>{
      if(!ok){
        item.status="failed";
        item.message=`Planning failed: ${message}`.slice(0,420);
        item.completedAt=new Date().toISOString();
        saveJson(historyFile,commandHistory);pushHistory();
        emitProjectEvent(project,"architect","Architect","error","error",item.command,item.message||"Planning failed");
        resolve(false);return;
      }

      const plan=output.trim();
      if(plan.length<120){
        item.status="failed";
        item.message="Planning failed: returned plan was too short to execute safely.";
        item.completedAt=new Date().toISOString();
        saveJson(historyFile,commandHistory);pushHistory();
        emitProjectEvent(project,"architect","Architect","error","error",item.command,item.message);
        resolve(false);return;
      }

      const file=planFileFor(project,item);
      fs.writeFileSync(file,plan+"\n","utf8");
      item.planPath=path.relative(project.path,file).replace(/\\/g,"/");
      item.planSummary=summarizePlan(plan);
      item.plannedAt=new Date().toISOString();
      item.status="plan_ready";
      item.message=`Plan ready: ${item.planPath}`;
      buildSubtaskContract(item,project);
      auditLog(project.id,"Architect","subtask_contract",item.workItemId||item.findingId||item.command,"success",`Contract created with ${(item.ownedFiles||[]).length} owned file(s).`);
      saveJson(historyFile,commandHistory);pushHistory();

      emitProjectEvent(project,"architect","Architect","task_completed","done",item.command,
        `Implementation plan ready for ${item.findingId||item.workItemId||item.command}`);

      emitProjectEvent(project,"cto","CTO","validation","reviewing",item.command,
        `CTO reviewed technical plan for ${item.findingId||item.workItemId||item.command}`);
      emitProjectEvent(project,"ceo","CEO","validation","reviewing",item.command,
        `CEO accepted CTO-reviewed plan and released task for execution`);
      resolve(true);
    };

    child.on("error",e=>finish(false,e.message));
    child.on("close",code=>{
      const ok=code===0;
      const msg=(ok?output:(err||output)).trim().replace(/\s+/g," ");
      finish(ok,msg||`${provider} planning exited ${code}`);
    });
  });
}


function verifierDirectory(project:Project){
  const dir=path.join(project.path,".ai-kit","office-verifications");
  fs.mkdirSync(dir,{recursive:true});
  return dir;
}
function verifierPrompt(item:CommandHistory,plan:string,result:string){
  return [
    "You are the INDEPENDENT READ-ONLY VERIFIER for AI Development Office.",
    "Do not modify any file, dependency, git state, generated output, or project state.",
    `Task: ${item.workItemId||item.findingId||item.command}.`,
    `Lead role: ${item.leadRole||item.assignedRole||"unknown"}.`,
    `Collaborators: ${(item.collaboratorRoles||[]).join(", ")||"none"}.`,
    "Inspect the CURRENT repository state and relevant tests/evidence independently.",
    "Compare the actual repository result against the approved plan.",
    "Detect scope drift, unplanned changes, missing acceptance criteria, regressions, and unsupported completion claims.",
    "Return these exact leading lines:",
    "VERDICT: PASS or VERDICT: FAIL",
    "DRIFT: NO or DRIFT: YES",
    "Then provide concise evidence and reasons.",
    "",
    "APPROVED PLAN:",
    plan||"(no plan required)",
    "",
    "EXECUTOR RESULT SUMMARY:",
    result.slice(0,5000)
  ].join("\n");
}
function parseVerifier(text:string){
  const verdict=/VERDICT:\s*PASS/i.test(text)?"passed":/VERDICT:\s*FAIL/i.test(text)?"failed":"error";
  const drift=/DRIFT:\s*YES/i.test(text)?"detected":/DRIFT:\s*NO/i.test(text)?"clean":"not_checked";
  return {verdict,drift};
}
async function runIndependentVerifier(item:CommandHistory,project:Project,executorProvider:ActiveProvider,resultText:string){
  item.verifierStatus="pending";item.driftStatus="not_checked";
  saveJson(historyFile,commandHistory);pushHistory();

  const cursor=findCursor(),claude=findClaude();
  // Prefer a different available provider for independence; otherwise use a fresh read-only process.
  let provider:ActiveProvider|null=null;
  if(executorProvider==="cursor"&&claude)provider="claude";
  else if(executorProvider==="claude"&&cursor)provider="cursor";
  else provider=executorProvider;

  const exe=provider==="cursor"?cursor:claude;
  if(!provider||!exe){
    item.verifierStatus="error";item.driftSummary="No verifier provider available.";
    return false;
  }

  let plan="";
  if(item.planPath){
    try{plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");}catch{}
  }

  emitProjectEvent(project,"verifier","Independent Verifier","validation","reviewing",
    item.workItemId||item.findingId||item.command,`Independent verification via ${provider}`);

  return await new Promise<boolean>(resolve=>{
    const child=spawnRunner(provider,exe,project,verifierPrompt(item,plan,resultText),false);
    let output="",err="",settled=false;
    const finish=(ok:boolean)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer=setTimeout(()=>{
      try{child.kill();}catch{}
      item.verifierStatus="error";
      item.driftStatus="not_checked";
      item.driftSummary="Independent verifier timed out.";
      emitProjectEvent(project,"verifier","Independent Verifier","validation","error",
        item.workItemId||item.findingId||item.command,"Verifier timed out");
      finish(false);
    },120000);
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>24000)output=output.slice(-24000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>8000)err=err.slice(-8000);});
    child.on("error",e=>{
      item.verifierStatus="error";item.driftStatus="not_checked";item.driftSummary=e.message.slice(0,320);
      finish(false);
    });
    child.on("close",code=>{
      if(settled)return;
      const text=((code===0?output:(err||output))||"").trim();
      const parsed=parseVerifier(text);
      item.verifierStatus=parsed.verdict as any;
      item.driftStatus=parsed.drift as any;
      item.driftSummary=text.replace(/\s+/g," ").slice(0,520);
      const file=path.join(verifierDirectory(project),`${item.id}.md`);
      fs.writeFileSync(file,text||`Verifier exited ${code}`,"utf8");
      item.verifierReportPath=path.relative(project.path,file).replace(/\\/g,"/");
      emitProjectEvent(project,"verifier","Independent Verifier","validation",
        parsed.verdict==="passed"&&parsed.drift==="clean"?"done":"blocked",
        item.workItemId||item.findingId||item.command,
        `${parsed.verdict.toUpperCase()} · drift ${parsed.drift}`);
      finish(code===0&&parsed.verdict==="passed"&&parsed.drift==="clean");
    });
  });
}



type GitResult={ok:boolean;status:number|null;stdout:string;stderr:string};
function gitRun(cwd:string,args:string[],timeout=30000):GitResult{
  try{
    const r=spawnSync("git",["-c","core.safecrlf=false",...args],{cwd,encoding:"utf8",windowsHide:true,timeout,env:{...process.env,GIT_OPTIONAL_LOCKS:"0"}});
    return {ok:r.status===0,status:r.status,stdout:String(r.stdout||"").trim(),stderr:String(r.stderr||"").trim()};
  }catch(error){
    return {ok:false,status:null,stdout:"",stderr:error instanceof Error?error.message:String(error)};
  }
}
function isGitProject(project:Project){
  try{
    if(fs.existsSync(path.join(project.path,".git")))return true;
  }catch{}
  const r=gitRun(project.path,["rev-parse","--is-inside-work-tree"],8000);
  return r.ok&&/^true$/i.test(r.stdout);
}
function worktreeBase(project:Project,item:CommandHistory){
  return path.join(dataRoot,"worktrees",slug(project.id),item.id);
}
function safeRemoveDir(dir:string){
  try{if(fs.existsSync(dir))fs.rmSync(dir,{recursive:true,force:true});}catch{}
}
function createIsolatedWorktree(project:Project,item:CommandHistory,label:string){
  if(!isGitProject(project))return {ok:false,path:"",branch:"",error:"Project is not a Git working tree."};
  const base=worktreeBase(project,item);fs.mkdirSync(base,{recursive:true});
  const dir=path.join(base,slug(label));
  const branch=`office/${slug(project.id)}/${item.id.slice(0,8)}-${slug(label)}`;
  safeRemoveDir(dir);
  gitRun(project.path,["worktree","prune"],10000);
  // Unique command IDs make collisions unlikely; remove a stale branch from an interrupted previous attempt only.
  const branchExists=gitRun(project.path,["show-ref","--verify","--quiet",`refs/heads/${branch}`],8000).ok;
  if(branchExists)gitRun(project.path,["branch","-D",branch],10000);
  const created=gitRun(project.path,["worktree","add","-b",branch,dir,"HEAD"],30000);
  if(!created.ok)return {ok:false,path:"",branch:"",error:created.stderr||created.stdout||"git worktree add failed"};
  item.worktreePaths=item.worktreePaths||{};item.worktreePaths[label]=dir;
  return {ok:true,path:dir,branch,error:""};
}
function cleanupIsolatedWorktree(project:Project,dir:string,branch:string){
  if(dir)gitRun(project.path,["worktree","remove","--force",dir],30000);
  if(branch)gitRun(project.path,["branch","-D",branch],10000);
  gitRun(project.path,["worktree","prune"],10000);
  safeRemoveDir(dir);
}
function candidatePatch(worktreePath:string){
  // Intent-to-add lets git diff include newly created untracked files without committing/staging content in the main tree.
  gitRun(worktreePath,["add","-N","."],15000);
  const diff=gitRun(worktreePath,["diff","--binary","HEAD"],30000);
  const files=gitRun(worktreePath,["diff","--name-only","HEAD"],15000);
  const stat=gitRun(worktreePath,["diff","--numstat","HEAD"],15000);
  return {
    ok:diff.ok,
    patch:diff.stdout,
    files:files.stdout.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),
    stat:stat.stdout,
    error:diff.stderr
  };
}
function isOfficeRuntimePath(file:string){
  const normalized=file.replace(/\\/g,"/").replace(/^\.\//,"");
  return normalized.startsWith(".ai-kit/") ||
    normalized.startsWith("ai-kit/") ||
    normalized===".ai-kit" ||
    normalized==="ai-kit";
}
function dirtyMainFiles(project:Project){
  const r=gitRun(project.path,["status","--porcelain"],12000);
  if(!r.ok)return [] as string[];
  return r.stdout.split(/\r?\n/).filter(Boolean).map(line=>{
    const body=line.slice(3).trim();
    const arrow=body.lastIndexOf(" -> ");
    return (arrow>=0?body.slice(arrow+4):body).replace(/^"|"$/g,"");
  }).filter(Boolean).filter(file=>!isOfficeRuntimePath(file));
}
function mergeArtifactDir(project:Project){
  const dir=path.join(project.path,".ai-kit","office-merges");fs.mkdirSync(dir,{recursive:true});return dir;
}
function mergeGate(project:Project,item:CommandHistory,label:string,patch:string,files:string[]){
  item.mergeGateStatus="pending";item.conflictFiles=[];
  if(!patch.trim()){
    item.mergeGateStatus="blocked";item.mergeGateSummary="Candidate produced no repository diff.";
    return {ok:false,patchFile:"",error:item.mergeGateSummary};
  }
  const dirty=new Set(dirtyMainFiles(project));
  const conflicts=files.filter(file=>dirty.has(file));
  if(conflicts.length){
    item.mergeGateStatus="blocked";item.conflictFiles=conflicts;
    item.mergeGateSummary=`Main working tree has overlapping local changes: ${conflicts.join(", ")}`;
    return {ok:false,patchFile:"",error:item.mergeGateSummary};
  }
  const patchFile=path.join(mergeArtifactDir(project),`${item.id}-${slug(label)}.patch`);
  fs.writeFileSync(patchFile,patch,"utf8");
  const check=gitRun(project.path,["apply","--check","--binary",patchFile],30000);
  if(!check.ok){
    item.mergeGateStatus="blocked";item.mergeGateSummary=`git apply --check failed: ${check.stderr||check.stdout}`;
    return {ok:false,patchFile,error:item.mergeGateSummary};
  }
  item.mergeGateStatus="passed";item.mergeGateSummary=`Merge gate passed for ${files.length} file(s).`;
  return {ok:true,patchFile,error:""};
}
function applyMergePatch(project:Project,item:CommandHistory,patchFile:string){
  const applied=gitRun(project.path,["apply","--binary",patchFile],30000);
  if(!applied.ok){
    item.mergeGateStatus="failed";item.mergeGateSummary=`Patch application failed: ${applied.stderr||applied.stdout}`;
    return false;
  }
  item.mergeGateStatus="applied";item.mergeGateSummary=`Patch applied to main working tree. ${item.mergeGateSummary||""}`;
  return true;
}
function rollbackMergePatch(project:Project,item:CommandHistory,patchFile:string){
  const reversed=gitRun(project.path,["apply","-R","--binary",patchFile],30000);
  item.mergeGateSummary=`${item.mergeGateSummary||""} Verification failed after merge; rollback ${reversed.ok?"succeeded":"FAILED"}.`.trim();
  if(!reversed.ok)item.conflictFiles=[...(item.conflictFiles||[]),"ROLLBACK_FAILED"];
  return reversed.ok;
}
function candidateDiffScore(stat:string,files:string[]){
  let changed=0;
  for(const line of stat.split(/\r?\n/).filter(Boolean)){
    const [a,b]=line.split(/\s+/);
    const add=Number(a),del=Number(b);
    if(Number.isFinite(add))changed+=add;
    if(Number.isFinite(del))changed+=del;
  }
  return files.length*1000+changed;
}
function isolationArtifact(project:Project,item:CommandHistory,data:any){
  const dir=path.join(project.path,".ai-kit","office-executions");fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,`${item.id}.json`),JSON.stringify({projectId:project.id,commandId:item.id,updatedAt:new Date().toISOString(),...data},null,2));
}

function collaborationDirectory(project:Project){
  const dir=path.join(project.path,".ai-kit","office-collaboration");
  fs.mkdirSync(dir,{recursive:true});
  return dir;
}
function collaboratorPrompt(item:CommandHistory,role:string,plan:string){
  return [
    `You are the ${role} collaborator for AI Development Office.`,
    "This is a READ-ONLY pre-execution review. Do not modify any file, dependency, git state, generated output, or project state.",
    `Task: ${item.workItemId||item.findingId||item.command}.`,
    `Lead role: ${item.leadRole||item.assignedRole||"unknown"}.`,
    "Inspect the repository evidence relevant to your role and review the approved plan before the lead agent executes it.",
    "Identify missing acceptance criteria, security/test/data risks, unsafe sequencing, or contradictions.",
    "Do not invent product requirements.",
    "Return these exact leading lines:",
    "REVIEW: PASS or REVIEW: BLOCK",
    "BLOCKER: NO or BLOCKER: YES",
    "Then provide concise role-specific recommendations and evidence.",
    "",
    "APPROVED PLAN:",
    plan
  ].join("\n");
}
function collaboratorProvider(role:string,leadProvider:ActiveProvider){
  const cursor=findCursor(),claude=findClaude();
  const seed=role.toLowerCase().split("").reduce((n,ch)=>n+ch.charCodeAt(0),0);
  if(cursor&&claude)return seed%2===0?"cursor":"claude";
  if(leadProvider==="cursor"&&cursor)return"cursor";
  if(leadProvider==="claude"&&claude)return"claude";
  return cursor?"cursor":claude?"claude":null;
}
async function runOneCollaboratorReview(item:CommandHistory,project:Project,leadProvider:ActiveProvider,role:string,plan:string,prepared:{path:string;branch:string}){
  item.collaboratorStatus=item.collaboratorStatus||{};
  item.collaboratorReportPaths=item.collaboratorReportPaths||{};
  item.collaboratorStatus[role]="pending";
  saveJson(historyFile,commandHistory);pushHistory();

  const provider=collaboratorProvider(role,leadProvider);
  const exe=provider==="cursor"?findCursor():provider==="claude"?findClaude():null;
  const subject=item.workItemId||item.findingId||item.command;
  emitProjectEvent(project,normalizeLane(role),role,"handoff","reading",subject,`${role} reviewing approved plan in isolated review worktree`);

  if(!provider||!exe){
    item.collaboratorStatus[role]="error";
    cleanupIsolatedWorktree(project,prepared.path,prepared.branch);
    return {role,ok:false,blocked:true,text:"No collaborator provider available."};
  }

  const reviewProject={...project,path:prepared.path};
  return await new Promise<{role:string;ok:boolean;blocked:boolean;text:string}>(resolve=>{
    const child=spawnRunner(provider,exe,reviewProject,collaboratorPrompt(item,role,plan),false);
    let output="",err="";
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>18000)output=output.slice(-18000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>6000)err=err.slice(-6000);});
    child.on("error",e=>{
      item.collaboratorStatus![role]="error";
      cleanupIsolatedWorktree(project,prepared.path,prepared.branch);
      resolve({role,ok:false,blocked:true,text:e.message});
    });
    child.on("close",code=>{
      const text=((code===0?output:(err||output))||"").trim();
      const blocked=/REVIEW:\s*BLOCK/i.test(text)||/BLOCKER:\s*YES/i.test(text)||code!==0;
      const ok=code===0&&!blocked&&(/REVIEW:\s*PASS/i.test(text)||/BLOCKER:\s*NO/i.test(text));
      item.collaboratorStatus![role]=blocked?"blocked":ok?"passed":"error";
      const file=path.join(collaborationDirectory(project),`${item.id}-${normalizeLane(role)}.md`);
      fs.writeFileSync(file,text||`${role} collaborator exited ${code}`,"utf8");
      item.collaboratorReportPaths![role]=path.relative(project.path,file).replace(/\\/g,"/");
      emitProjectEvent(project,normalizeLane(role),role,"validation",blocked?"blocked":"done",subject,
        blocked?`${role} blocked lead execution`:`${role} approved plan for lead execution`);
      cleanupIsolatedWorktree(project,prepared.path,prepared.branch);
      resolve({role,ok,blocked,text});
    });
  });
}
async function runCollaboratorReviews(item:CommandHistory,project:Project,leadProvider:ActiveProvider){
  const roles=[...new Set((item.collaboratorRoles||[]).filter(Boolean).filter(role=>role!==(item.leadRole||item.assignedRole)))].slice(0,3);
  if(!roles.length){
    item.collaboratorStatus={};
    item.collaboratorSummary="No collaborators required.";
    return {ok:true,context:""};
  }

  let plan="";
  if(item.planPath){
    try{plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");}catch{}
  }
  if(!plan){
    item.collaboratorSummary="Collaborator review skipped because approved plan artifact was unavailable.";
    return {ok:false,context:""};
  }

  item.status="plan_ready";
  item.message=`${roles.length} isolated collaborator review${roles.length===1?"":"s"} running before lead execution.`;
  saveJson(historyFile,commandHistory);pushHistory();

  const prepared:Array<{role:string;path:string;branch:string}>=[];
  for(const role of roles){
    const wt=createIsolatedWorktree(project,item,`review-${role}`);
    if(!wt.ok){
      for(const previous of prepared)cleanupIsolatedWorktree(project,previous.path,previous.branch);
      item.collaboratorStatus=item.collaboratorStatus||{};
      item.collaboratorStatus[role]="error";
      item.collaboratorSummary=`${role}: ERROR creating isolated review worktree`;
      return {ok:false,context:""};
    }
    prepared.push({role,path:wt.path,branch:wt.branch});
  }
  const results=await Promise.all(prepared.map(review=>runOneCollaboratorReview(item,project,leadProvider,review.role,plan,review)));
  const blocked=results.filter(x=>x.blocked);
  const context=results.map(x=>`[${x.role}] ${x.text.replace(/\s+/g," ").slice(0,1400)}`).join("\n");
  item.collaboratorSummary=results.map(x=>`${x.role}: ${x.blocked?"BLOCK":x.ok?"PASS":"ERROR"}`).join(" · ");
  saveJson(historyFile,commandHistory);pushHistory();
  return {ok:blocked.length===0&&results.every(x=>x.ok),context};
}


async function runIsolatedCandidate(
  item:CommandHistory,
  project:Project,
  provider:ActiveProvider,
  label:string,
  collaborationContext:string,
  prepared?:{path:string;branch:string},
  roleOverride?:string,
  scopeInstruction?:string
){
  const exe=provider==="cursor"?findCursor():findClaude();
  if(!exe)return {ok:false,label,provider,output:"",patch:"",files:[] as string[],stat:"",worktreePath:"",branch:"",error:`${provider} unavailable`};

  const wt=prepared?{ok:true,path:prepared.path,branch:prepared.branch,error:""}:createIsolatedWorktree(project,item,label);
  if(!wt.ok)return {ok:false,label,provider,role:roleOverride||item.leadRole||item.assignedRole||provider,output:"",patch:"",files:[] as string[],stat:"",worktreePath:"",branch:"",error:wt.error};

  let plan="";
  if(item.planPath){
    try{plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");}catch{}
  }
  const candidateProject={...project,path:wt.path};
  const candidateRole=roleOverride||item.leadRole||item.assignedRole||provider;
  const prompt=executionPromptWithPlan(item,plan,[
    collaborationContext,
    skillPolicyPrompt(project),
    `Isolation mode: you are working in dedicated Git worktree '${label}'. Do not access or modify the main working tree.`,
    roleOverride?`You are the ${candidateRole} coding collaborator, not the lead. Implement only the role-scoped subtask described below. Do not duplicate unrelated lead work.`:"",
    scopeInstruction||""
  ].filter(Boolean).join("\n"));

  emitProjectEvent(project,normalizeLane(candidateRole),candidateRole,
    "task_started","working",item.workItemId||item.findingId||item.command,`${provider} isolated ${candidateRole} candidate ${label} started`);

  return await new Promise<any>(resolve=>{
    const child=spawnRunner(provider,exe,candidateProject,prompt,true);
    let output="",err="";
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>22000)output=output.slice(-22000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>9000)err=err.slice(-9000);});
    child.on("error",e=>resolve({ok:false,label,provider,role:candidateRole,output:"",patch:"",files:[],stat:"",worktreePath:wt.path,branch:wt.branch,error:e.message}));
    child.on("close",code=>{
      const text=((code===0?output:(err||output))||"").trim();
      const diff=candidatePatch(wt.path);
      const contractCheck=enforceContractFiles(item,project,diff.files);
      const ok=code===0&&diff.ok&&!!diff.patch.trim()&&contractCheck.ok;
      emitProjectEvent(project,normalizeLane(candidateRole),candidateRole,
        ok?"task_completed":"error",ok?"done":"error",item.workItemId||item.findingId||item.command,
        ok?`${candidateRole} candidate ready with ${diff.files.length} changed file(s)`:`${candidateRole} candidate failed: ${contractCheck.violations.length?`contract violation ${contractCheck.violations.join(", ")}`:text.slice(0,220)}`);
      resolve({ok,label,provider,role:candidateRole,output:text,patch:diff.patch,files:diff.files,stat:diff.stat,worktreePath:wt.path,branch:wt.branch,error:ok?"":(contractCheck.violations.length?`Subtask contract blocked files: ${contractCheck.violations.join(", ")}`:(text||diff.error||"candidate produced no diff"))});
    });
  });
}
async function verifyIsolatedCandidate(item:CommandHistory,mainProject:Project,candidate:any,label:string){
  if(!candidate.ok)return {ok:false,verdict:"error",drift:"not_checked",text:candidate.error};
  const cursor=findCursor(),claude=findClaude();
  let provider:ActiveProvider|null=null;
  if(candidate.provider==="cursor"&&claude)provider="claude";
  else if(candidate.provider==="claude"&&cursor)provider="cursor";
  else provider=candidate.provider;
  const exe=provider==="cursor"?cursor:provider==="claude"?claude:null;
  if(!provider||!exe)return {ok:false,verdict:"error",drift:"not_checked",text:"No candidate verifier available."};

  let plan="";
  if(item.planPath){try{plan=fs.readFileSync(path.join(mainProject.path,item.planPath),"utf8");}catch{}}
  const candidateProject={...mainProject,path:candidate.worktreePath};
  const prompt=verifierPrompt(item,plan,candidate.output);

  return await new Promise<any>(resolve=>{
    const child=spawnRunner(provider,exe,candidateProject,prompt,false);
    let output="",err="";
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>22000)output=output.slice(-22000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>7000)err=err.slice(-7000);});
    child.on("error",e=>resolve({ok:false,verdict:"error",drift:"not_checked",text:e.message}));
    child.on("close",code=>{
      const text=((code===0?output:(err||output))||"").trim();
      const parsed=parseVerifier(text);
      const dir=verifierDirectory(mainProject);
      fs.writeFileSync(path.join(dir,`${item.id}-${slug(label)}.md`),text||`Candidate verifier exited ${code}`,"utf8");
      resolve({ok:code===0&&parsed.verdict==="passed"&&parsed.drift==="clean",verdict:parsed.verdict,drift:parsed.drift,text});
    });
  });
}
async function ctoSelectCompetitiveWinner(item:CommandHistory,project:Project,candidates:any[]){
  const valid=candidates.filter(c=>c.candidate.ok&&c.verification.ok);
  if(!valid.length)return {winner:null as ActiveProvider|null,text:"No candidate passed independent verification."};
  if(valid.length===1)return {winner:valid[0].candidate.provider as ActiveProvider,text:`Only ${valid[0].candidate.provider} passed verification.`};

  let plan="";
  if(item.planPath){try{plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");}catch{}}
  const summaries=valid.map(v=>[
    `CANDIDATE ${v.candidate.provider.toUpperCase()}`,
    `Files: ${v.candidate.files.join(", ")}`,
    `Diff stat: ${v.candidate.stat.slice(0,2400)}`,
    `Executor summary: ${v.candidate.output.replace(/\s+/g," ").slice(0,1800)}`,
    `Verifier: ${v.verification.text.replace(/\s+/g," ").slice(0,1800)}`
  ].join("\n")).join("\n\n");

  const provider=resolveProvider(project);
  const exe=provider==="cursor"?findCursor():provider==="claude"?findClaude():null;
  if(provider&&exe){
    const prompt=[
      "You are the CTO selection gate for AI Development Office.",
      "This is READ-ONLY. Compare two independently verified implementations for the same approved plan.",
      "Prefer correctness, acceptance-criteria coverage, smaller justified scope, maintainability, security and tests.",
      "Do not modify files.",
      "Return exactly one leading line: WINNER: cursor, WINNER: claude, or WINNER: BLOCK.",
      "Then explain the evidence briefly.",
      "",
      "APPROVED PLAN:",plan,
      "",summaries
    ].join("\n");

    const result=await new Promise<{text:string;code:number|null}>(resolve=>{
      const child=spawnRunner(provider,exe,project,prompt,false);
      let output="",err="";
      child.stdout?.on("data",d=>{output+=d.toString();if(output.length>24000)output=output.slice(-24000);});
      child.stderr?.on("data",d=>{err+=d.toString();if(err.length>7000)err=err.slice(-7000);});
      child.on("error",e=>resolve({text:e.message,code:null}));
      child.on("close",code=>resolve({text:((code===0?output:(err||output))||"").trim(),code}));
    });
    const dir=path.join(project.path,".ai-kit","office-competitive");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,`${item.id}-cto-selection.md`),result.text||"No CTO output","utf8");
    if(/WINNER:\s*cursor/i.test(result.text))return {winner:"cursor" as ActiveProvider,text:result.text};
    if(/WINNER:\s*claude/i.test(result.text))return {winner:"claude" as ActiveProvider,text:result.text};
    if(/WINNER:\s*BLOCK/i.test(result.text))return {winner:null as ActiveProvider|null,text:result.text};
  }

  // Deterministic conservative fallback if CTO output is unavailable or malformed.
  const sorted=[...valid].sort((a,b)=>candidateDiffScore(a.candidate.stat,a.candidate.files)-candidateDiffScore(b.candidate.stat,b.candidate.files));
  return {winner:sorted[0].candidate.provider as ActiveProvider,text:`Deterministic fallback selected ${sorted[0].candidate.provider}: both passed; smaller verified diff won.`};
}


function candidateOverlapFiles(candidates:any[]){
  const owners=new Map<string,string[]>();
  for(const candidate of candidates){
    for(const file of candidate.files||[]){
      const current=owners.get(file)||[];
      current.push(String(candidate.role||candidate.label||candidate.provider));
      owners.set(file,current);
    }
  }
  return [...owners.entries()].filter(([,roles])=>roles.length>1).map(([file,roles])=>({file,roles}));
}

function isolationPreflight(project:Project,item:CommandHistory){
  if(!isGitProject(project)){
    return {ok:false,message:"Collaborative/Competitive execution requires Git. Choose Solo for a non-Git project.",dirty:[] as string[]};
  }
  const dirty=dirtyMainFiles(project);
  if(dirty.length){
    return {ok:false,message:`Isolated execution requires a clean Git working tree. Commit/stash current changes or choose Solo. Dirty: ${dirty.slice(0,8).join(", ")}`,dirty};
  }
  return {ok:true,message:"",dirty:[] as string[]};
}

async function runIsolatedExecution(item:CommandHistory,project:Project,leadProvider:ActiveProvider,collaborationContext:string){
  const mode=item.executionMode||"collaborative";
  item.isolationStatus="pending";item.mergeGateStatus="pending";item.conflictFiles=[];
  saveJson(historyFile,commandHistory);pushHistory();

  const preflight=isolationPreflight(project,item);
  if(!preflight.ok){
    item.isolationStatus="failed";item.mergeGateStatus="blocked";
    item.conflictFiles=preflight.dirty;
    item.mergeGateSummary=preflight.message;
    return {ok:false,message:item.mergeGateSummary};
  }

  item.isolationStatus="ready";
  if(mode==="collaborative"){
    const codingRoles=[...new Set((item.collaboratorCodingRoles||[])
      .filter(Boolean)
      .filter(role=>role!==(item.leadRole||item.assignedRole)))].slice(0,3);

    // Prepare worktrees sequentially to avoid Git worktree administration lock races,
    // then execute coding agents in parallel.
    const prepared:Array<{label:string;role:string;provider:ActiveProvider;path:string;branch:string}>=[];
    const leadLabel=`lead-${leadProvider}`;
    const leadWt=createIsolatedWorktree(project,item,leadLabel);
    if(!leadWt.ok)return {ok:false,message:leadWt.error};
    prepared.push({label:leadLabel,role:item.leadRole||item.assignedRole||"Lead",provider:leadProvider,path:leadWt.path,branch:leadWt.branch});

    for(const role of codingRoles){
      const provider=collaboratorProvider(role,leadProvider);
      if(!provider){
        for(const entry of prepared)cleanupIsolatedWorktree(project,entry.path,entry.branch);
        return {ok:false,message:`No coding provider available for collaborator ${role}.`};
      }
      const label=`coding-${role}-${provider}`;
      const wt=createIsolatedWorktree(project,item,label);
      if(!wt.ok){
        for(const entry of prepared)cleanupIsolatedWorktree(project,entry.path,entry.branch);
        return {ok:false,message:`Could not create ${role} worktree: ${wt.error}`};
      }
      prepared.push({label,role,provider,path:wt.path,branch:wt.branch});
    }

    const candidateJobs=prepared.map(entry=>{
      const isLead=entry.label===leadLabel;
      const scope=isLead
        ? `You are the lead implementation agent. Coding collaborators for this task: ${codingRoles.join(", ")||"none"}. Focus on the core task and avoid intentionally duplicating collaborator-owned work.`
        : `Role-scoped subtask for ${entry.role}: inspect the approved plan and implement only changes clearly belonging to ${entry.role}. Keep the patch minimal and independently testable. If the role has no justified code change, stop and report that instead of editing unrelated files.`;
      return runIsolatedCandidate(
        item,project,entry.provider,entry.label,collaborationContext,
        {path:entry.path,branch:entry.branch},
        isLead?undefined:entry.role,
        scope
      );
    });

    const candidates=await Promise.all(candidateJobs);
    const failedCandidate=candidates.find(candidate=>!candidate.ok);
    if(failedCandidate){
      for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
      return {ok:false,message:`Isolated coding candidate failed: ${failedCandidate.role||failedCandidate.label} · ${failedCandidate.error}`};
    }

    const candidateVerifications=await Promise.all(
      candidates.map(async candidate=>({candidate,verification:await verifyIsolatedCandidate(item,project,candidate,candidate.label)}))
    );
    const failedVerification=candidateVerifications.find(entry=>!entry.verification.ok);
    if(failedVerification){
      for(const candidate of candidates)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
      return {ok:false,message:`Candidate verifier blocked ${failedVerification.candidate.role||failedVerification.candidate.label}: ${failedVerification.verification.text.slice(0,300)}`};
    }

    // Conflict Detector: multiple coding agents may not silently edit the same file.
    const overlaps=candidateOverlapFiles(candidates);
    if(overlaps.length){
      item.mergeGateStatus="blocked";
      item.conflictFiles=overlaps.map(x=>x.file);
      item.mergeGateSummary=`Candidate patch overlap detected: ${overlaps.map(x=>`${x.file} (${x.roles.join(" + ")})`).join("; ")}`;
      for(const candidate of candidates)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
      isolationArtifact(project,item,{mode,candidates:candidates.map(c=>({role:c.role,provider:c.provider,files:c.files})),conflicts:overlaps,mergeGate:"blocked"});
      return {ok:false,message:item.mergeGateSummary};
    }

    const applied:Array<{candidate:any;patchFile:string}>=[];
    for(const candidate of candidates){
      const gate=mergeGate(project,item,candidate.label,candidate.patch,candidate.files);
      if(!gate.ok){
        for(const previous of [...applied].reverse())rollbackMergePatch(project,item,previous.patchFile);
        for(const c of candidates)cleanupIsolatedWorktree(project,c.worktreePath,c.branch);
        return {ok:false,message:gate.error};
      }
      if(!applyMergePatch(project,item,gate.patchFile)){
        for(const previous of [...applied].reverse())rollbackMergePatch(project,item,previous.patchFile);
        for(const c of candidates)cleanupIsolatedWorktree(project,c.worktreePath,c.branch);
        return {ok:false,message:item.mergeGateSummary||"Collaborative merge failed"};
      }
      applied.push({candidate,patchFile:gate.patchFile});
    }

    const combinedOutput=candidates.map(c=>`[${c.role||c.label} / ${c.provider}] ${c.output}`).join("\n\n");
    const verified=await runIndependentVerifier(item,project,leadProvider,combinedOutput);
    if(!verified){
      for(const previous of [...applied].reverse())rollbackMergePatch(project,item,previous.patchFile);
      for(const candidate of candidates)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
      return {ok:false,message:`Combined collaborative result failed main-tree verification. ${item.driftSummary||""}`};
    }

    isolationArtifact(project,item,{
      mode,
      candidates:candidateVerifications.map(v=>({
        role:v.candidate.role,provider:v.candidate.provider,files:v.candidate.files,
        verification:{verdict:v.verification.verdict,drift:v.verification.drift}
      })),
      mergeGate:item.mergeGateStatus,verifier:item.verifierStatus
    });
    for(const candidate of candidates)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
    return {ok:true,message:combinedOutput};
  }

  // Competitive mode requires both coding providers so the comparison is meaningful.
  const cursor=findCursor(),claude=findClaude();
  if(!cursor||!claude){
    item.isolationStatus="failed";item.mergeGateStatus="blocked";
    item.mergeGateSummary="Competitive mode requires both Cursor and Claude CLIs.";
    return {ok:false,message:item.mergeGateSummary};
  }

  const candidates=await Promise.all([
    runIsolatedCandidate(item,project,"cursor","cursor-candidate",collaborationContext),
    runIsolatedCandidate(item,project,"claude","claude-candidate",collaborationContext)
  ]);
  const verified=await Promise.all(candidates.map(async candidate=>({candidate,verification:await verifyIsolatedCandidate(item,project,candidate,candidate.label)})));
  const selection=await ctoSelectCompetitiveWinner(item,project,verified);
  item.competitiveWinner=selection.winner;
  item.competitiveSummary=selection.text.replace(/\s+/g," ").slice(0,1000);

  if(!selection.winner){
    for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
    item.mergeGateStatus="blocked";item.mergeGateSummary="CTO selection blocked: no acceptable competitive winner.";
    return {ok:false,message:item.mergeGateSummary};
  }

  const winner=candidates.find(c=>c.provider===selection.winner)!;
  const gate=mergeGate(project,item,`${winner.provider}-winner`,winner.patch,winner.files);
  if(!gate.ok){
    for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
    return {ok:false,message:gate.error};
  }
  if(!applyMergePatch(project,item,gate.patchFile)){
    for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
    return {ok:false,message:item.mergeGateSummary||"Winner merge failed"};
  }

  const mainVerified=await runIndependentVerifier(item,project,winner.provider,winner.output);
  if(!mainVerified){
    rollbackMergePatch(project,item,gate.patchFile);
    for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
    return {ok:false,message:`Competitive winner failed main-tree verification. ${item.driftSummary||""}`};
  }

  isolationArtifact(project,item,{
    mode,candidates:verified.map(v=>({provider:v.candidate.provider,files:v.candidate.files,verification:v.verification})),
    winner:selection.winner,selection:selection.text,mergeGate:item.mergeGateStatus,verifier:item.verifierStatus
  });
  for(const candidate of candidates)if(candidate.worktreePath)cleanupIsolatedWorktree(project,candidate.worktreePath,candidate.branch);
  return {ok:true,message:winner.output};
}

async function runItem(item:CommandHistory){
  const project=projects.find(p=>p.id===item.projectId);
  if(!project)throw new Error("Project disappeared from Office registry.");

  if(!project.runnerTrusted){
    item.status="waiting_for_agent";
    item.message="Workspace trust required in AI Development Office.";
    saveJson(historyFile,commandHistory);pushHistory();
    return false;
  }

  const provider=resolveProvider(project);
  if(!provider){
    item.status="waiting_for_agent";
    item.message=`Selected provider '${project.provider||"auto"}' is unavailable.`;
    saveJson(historyFile,commandHistory);pushHistory();pushRunner();
    return false;
  }

  const exe=provider==="cursor"?findCursor():findClaude();
  if(!exe)return false;

  if(!claimLane(item,provider))return false;
  pushRunner();

  if(commandRequiresPlan(item)&&!item.planPath){
    const planned=await createPlan(item,project,provider,exe);
    if(!planned){
      releaseLane(item);pushRunner();
      return false;
    }
  }

  let executionMode=item.executionMode||"solo";
  if(isMutating(item)&&executionMode!=="solo"){
    const preflight=isolationPreflight(project,item);
    if(!preflight.ok){
      executionMode="solo";
      item.executionMode="solo";
      item.isolationStatus="not_required";
      item.mergeGateStatus="not_required";
      item.conflictFiles=preflight.dirty;
      item.mergeGateSummary=`Isolation unavailable; running Solo. ${preflight.message}`;
      item.message=item.mergeGateSummary.slice(0,420);
      saveJson(historyFile,commandHistory);pushHistory();
    }
  }

  let collaborationContext="";
  if(isMutating(item)&&executionMode!=="solo"&&(item.collaboratorRoles||[]).length){
    const collaboration=await runCollaboratorReviews(item,project,provider);
    collaborationContext=collaboration.context;
    if(!collaboration.ok){
      item.status="failed";
      item.qualityGateStatus="failed";
      item.message=`Collaborator review blocked lead execution. ${item.collaboratorSummary||""}`.slice(0,420);
      item.completedAt=new Date().toISOString();
      writeTaskReport(item,project,item.message,false);
      releaseLane(item);saveJson(historyFile,commandHistory);pushHistory();pushRunner();
      emitProjectEvent(project,"ceo","CEO","blocked","blocked",item.command,item.message);
      return false;
    }
  }

  item.status="running";item.startedAt=new Date().toISOString();item.provider=provider;item.message=`${provider} CLI running`;
  saveJson(historyFile,commandHistory);pushHistory();pushRunner();

  emitProjectEvent(project,"ceo","CEO","task_started","planning",item.command,
    item.findingId?`CEO dispatching ${item.findingId} to ${item.assignedRole} via ${provider}`:`CEO starting ${item.command} via ${provider}`);

  if(item.assignedRole){
    const actorId=item.assignedRole.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
    const assignedTask=item.findingId
      ? `${item.findingId} ${item.findingTitle||""}`
      : item.workItemId
        ? `${item.workItemId} ${item.workItemTitle||""}`
        : item.command;
    emitProjectEvent(project,actorId,item.assignedRole,"task_started",
      item.assignedRole==="QA"?"testing":item.assignedRole==="Security"?"reviewing":"working",
      assignedTask,"Assigned by CEO / CTO");
    for(const collaborator of item.collaboratorRoles||[]){
      const collaboratorId=normalizeLane(collaborator);
      emitProjectEvent(project,collaboratorId,collaborator,"handoff","reading",assignedTask,
        `Collaborating with lead ${item.leadRole||item.assignedRole}`);
    }
  }

  if(isMutating(item)&&executionMode!=="solo"){
    item.message=`${executionMode} isolated execution running`;
    saveJson(historyFile,commandHistory);pushHistory();
    const isolated=await runIsolatedExecution(item,project,provider,collaborationContext);
    const ok=isolated.ok;
    item.status=ok?"completed":"failed";
    if(item.recoveryState==="recoverable")item.recoveryState="none";
    item.qualityGateStatus=ok?"pending_reaudit":"failed";
    item.completedAt=new Date().toISOString();
    item.message=isolated.message.slice(0,320);
    writeTaskReport(item,project,isolated.message,ok);
    writeDependencyGraph(project.id);
    releaseLane(item);
    saveJson(historyFile,commandHistory);pushHistory();pushRunner();
    emitProjectEvent(project,"ceo","CEO",ok?"task_completed":"error",ok?"done":"error",item.command,
      ok?`${executionMode} execution merged and independently verified`:`${executionMode} execution blocked: ${isolated.message}`);
    return ok;
  }

  item.isolationStatus="not_required";
  item.mergeGateStatus="not_required";
  return await new Promise<boolean>((resolve)=>{
    let executionPrompt=[promptFor(item),skillPolicyPrompt(project)].filter(Boolean).join("\n");
    if(commandRequiresPlan(item)&&item.planPath){
      try{
        const plan=fs.readFileSync(path.join(project.path,item.planPath),"utf8");
        executionPrompt=executionPromptWithPlan(item,plan,[collaborationContext,skillPolicyPrompt(project)].filter(Boolean).join("\n"));
      }catch{
        item.status="failed";
        item.message="Plan artifact missing; execution blocked.";
        item.completedAt=new Date().toISOString();
        releaseLane(item);
        saveJson(historyFile,commandHistory);pushHistory();pushRunner();
        resolve(false);return;
      }
    }
    const child=spawnRunner(provider,exe,project,executionPrompt,isMutating(item));
    let output="",err="";
    child.stdout?.on("data",d=>{output+=d.toString();if(output.length>16000)output=output.slice(-16000);});
    child.stderr?.on("data",d=>{err+=d.toString();if(err.length>8000)err=err.slice(-8000);});

    const finish=(ok:boolean,message:string)=>{
      item.status=ok?"completed":"failed";
      if(item.recoveryState==="recoverable")item.recoveryState="none";
      item.qualityGateStatus=ok?(isMutating(item)?"pending_reaudit":"execution_passed"):"failed";
      item.completedAt=new Date().toISOString();item.message=message.slice(0,320);
      writeTaskReport(item,project,message,ok);
      writeDependencyGraph(project.id);
      releaseLane(item);
      saveJson(historyFile,commandHistory);pushHistory();pushRunner();
      emitProjectEvent(project,"ceo","CEO",ok?"task_completed":"error",ok?"done":"error",item.command,message);
      auditLog(project.id,"Office Runner",ok?"task_completed":"task_failed",item.workItemId||item.findingId||item.command,ok?"success":"error",message.slice(0,500));pushAuditTrail();
      resolve(ok);
    };

    child.on("error",e=>finish(false,e.message));
    child.on("close",async code=>{
      const executorOk=code===0;
      const text=(executorOk?output:(err||output)).trim().replace(/\s+/g," ");
      if(!executorOk){finish(false,text||`${provider} CLI exited ${code}`);return;}

      if(isMutating(item)){
        item.status="verifying";
        item.qualityGateStatus="pending";
        item.message="Execution finished; independent verifier is inspecting current repository evidence.";
        saveJson(historyFile,commandHistory);pushHistory();
        emitProjectEvent(project,"qa","QA","validation","testing",item.command,
          `Independent verification for ${item.findingId||item.workItemId||item.command}`);

        const verified=await runIndependentVerifier(item,project,provider,text);
        if(!verified){
          item.qualityGateStatus="failed";
          finish(false,`Independent verifier blocked completion. ${item.driftSummary||""}`);
          return;
        }
      }else{
        item.verifierStatus="not_required";item.driftStatus="not_checked";
      }
      finish(true,text||`${provider} CLI exited ${code}`);
    });
  });
}


function normalizedFeatureToken(value:string){
  const stop=new Set(["frontend","backend","security","tests","test","database","docs","devops","coverage","audit","implement","complete","missing","partial","create","update","edit","view","show","delete","validation","authorization"]);
  const words=value.toLowerCase().replace(/[^a-z0-9]+/g," ").split(/\s+/).filter(x=>x.length>2&&!stop.has(x));
  return words.slice(0,4);
}

function inferDependencies(items:any[]){
  const result=items.map(item=>({...item,dependencyIds:[...(item.dependencyIds||[])]}));
  for(const item of result){
    const type=String(item.type||item.workItemType||"").toLowerCase();
    const title=String(item.title||item.workItemTitle||"");
    const tokens=normalizedFeatureToken(title);

    const candidates=result.filter(other=>{
      if(other.id===item.id)return false;
      const ot=String(other.type||other.workItemType||"").toLowerCase();
      const otherTokens=normalizedFeatureToken(String(other.title||other.workItemTitle||""));
      const overlap=tokens.some(t=>otherTokens.includes(t));
      if(!overlap)return false;

      // Frontend may wait for backend/API/database work for the same feature.
      if(type==="frontend"&&["backend","database","feature"].includes(ot))return true;
      // Tests verify implementation, never the inverse.
      if(type==="test"&&["backend","frontend","database","feature","security"].includes(ot))return true;
      // Security verification may wait for implementation work.
      if(type==="security"&&["backend","frontend","feature"].includes(ot))return true;
      return false;
    });

    for(const dep of candidates){
      if(!item.dependencyIds.includes(dep.id))item.dependencyIds.push(dep.id);
    }
  }
  return result;
}

function dependencyState(item:CommandHistory){
  const deps=item.dependencyIds||[];
  if(!deps.length)return {ready:true,blockedBy:[] as string[]};

  const blockedBy:string[]=[];
  for(const depId of deps){
    const dep=commandHistory.find(c=>
      c.projectId===item.projectId &&
      (c.workItemId===depId||c.findingId===depId||c.id===depId)
    );
    if(!dep||dep.status!=="completed"||dep.qualityGateStatus==="failed"||(isMutating(dep)&&dep.verifierStatus!=="passed"))blockedBy.push(depId);
  }
  return {ready:blockedBy.length===0,blockedBy};
}

function dependencyGraphFile(project:Project){
  return path.join(project.path,".ai-kit","office-dependency-graph.json");
}
function writeDependencyGraph(projectId:string){
  const project=projects.find(p=>p.id===projectId);if(!project)return;
  const nodes=commandHistory
    .filter(c=>c.projectId===projectId&&(c.workItemId||c.findingId))
    .map(c=>({
      id:c.workItemId||c.findingId||c.id,
      commandId:c.id,
      title:c.workItemTitle||c.findingTitle||c.command,
      lane:laneFor(c),
      status:c.status,
      dependencies:c.dependencyIds||[],
      blockedBy:c.blockedBy||[]
    }));
  fs.mkdirSync(path.join(project.path,".ai-kit"),{recursive:true});
  fs.writeFileSync(dependencyGraphFile(project),JSON.stringify({
    projectId,generatedAt:new Date().toISOString(),nodes
  },null,2));
}

function taskReportDir(project:Project){
  const dir=path.join(project.path,".ai-kit","task-reports");
  fs.mkdirSync(dir,{recursive:true});
  return dir;
}
function writeTaskReport(item:CommandHistory,project:Project,resultText:string,ok:boolean){
  const report={
    id:item.id,
    projectId:item.projectId,
    workItemId:item.workItemId||null,
    findingId:item.findingId||null,
    title:item.workItemTitle||item.findingTitle||item.command,
    command:item.command,
    provider:item.provider||null,
    assignedRole:item.assignedRole||null,
    executionLane:item.executionLane||laneFor(item),
    sprintId:item.sprintId||item.queueGroupId||null,
    dependencies:item.dependencyIds||[],
    planPath:item.planPath||null,
    startedAt:item.startedAt||null,
    completedAt:item.completedAt||null,
    runnerExitOk:ok,
    qualityGateStatus:item.qualityGateStatus||"not_required",
    leadRole:item.leadRole||item.assignedRole||null,
    collaboratorRoles:item.collaboratorRoles||[],
    collaboratorCodingRoles:item.collaboratorCodingRoles||[],
    verifierStatus:item.verifierStatus||"not_required",
    verifierReportPath:item.verifierReportPath||null,
    driftStatus:item.driftStatus||"not_checked",
    driftSummary:item.driftSummary||null,
    collaboratorStatus:item.collaboratorStatus||{},
    collaboratorReportPaths:item.collaboratorReportPaths||{},
    collaboratorSummary:item.collaboratorSummary||null,
    executionMode:item.executionMode||"solo",
    isolationStatus:item.isolationStatus||"not_required",
    worktreePaths:item.worktreePaths||{},
    mergeGateStatus:item.mergeGateStatus||"not_required",
    mergeGateSummary:item.mergeGateSummary||null,
    conflictFiles:item.conflictFiles||[],
    competitiveWinner:item.competitiveWinner||null,
    competitiveSummary:item.competitiveSummary||null,
    subtaskContractPath:item.subtaskContractPath||null,
    ownedFiles:item.ownedFiles||[],ownershipStatus:item.ownershipStatus||"not_required",ownershipConflicts:item.ownershipConflicts||[],recoveryState:item.recoveryState||"none",
    resultSummary:resultText.slice(0,5000),
    usage:{inputTokens:null,outputTokens:null,costUsd:null,source:"unavailable"},
  };
  const file=path.join(taskReportDir(project),`${item.id}.json`);
  fs.writeFileSync(file,JSON.stringify(report,null,2));
  item.taskReportPath=path.relative(project.path,file).replace(/\\/g,"/");
  return item.taskReportPath;
}

async function processQueue(){
  const capacity=MAX_PARALLEL_RUNNERS-activeLaneItems.size;
  if(capacity<=0)return;

  const candidates=commandHistory
    .filter(x=>x.status==="queued"||x.status==="waiting_for_agent")
    .sort((a,b)=>(a.queueSequence||0)-(b.queueSequence||0)||a.createdAt.localeCompare(b.createdAt));

  const ready:CommandHistory[]=[];
  for(const item of candidates){
    const depState=dependencyState(item);
    item.blockedBy=depState.blockedBy;
    if(!depState.ready){
      item.message=`Waiting for dependencies: ${depState.blockedBy.join(", ")}`;
      continue;
    }

    const ownerConflicts=ownershipConflicts(item);
    item.ownershipConflicts=ownerConflicts;
    if(ownerConflicts.length){item.ownershipStatus="conflict";item.message=`File ownership conflict: ${ownerConflicts.join("; ")}`;continue;}
    else if((item.ownedFiles||[]).length)item.ownershipStatus="ready";

    const project=projects.find(p=>p.id===item.projectId);
    if(!project||!resolveProvider(project))continue;
    ready.push(item);
  }

  // Read-only commands get their own lanes so a long status does not block review/coverage.
  // Mutating work is preferred when slots are scarce.
  const selected=pickQueueItems(ready,activeLaneItems.keys(),capacity,item=>laneFor(item));

  if(candidates.length) {
    const touchedProjects=new Set(candidates.map(x=>x.projectId));
    saveJson(historyFile,commandHistory);
    for(const projectId of touchedProjects)writeDependencyGraph(projectId);
    pushHistory();
  }

  for(const next of selected){
    void runItem(next).then(ok=>{
      if(!ok&&next.queueGroupId){
        let changed=false;
        const failedLane=laneFor(next);
        for(const x of commandHistory){
          if(
            x.projectId===next.projectId &&
            x.queueGroupId===next.queueGroupId &&
            x.status==="queued" &&
            laneFor(x)===failedLane
          ){
            x.status="cancelled";
            x.message=`Stopped ${failedLane} lane after ${next.workItemId||next.findingId||next.id} failed`;
            changed=true;
          }
        }
        if(changed){saveJson(historyFile,commandHistory);pushHistory();}
      }
      processQueue();
    }).catch(error=>{
      console.error("Parallel lane runner failed:",error);
      releaseLane(next);pushRunner();processQueue();
    });
  }
}
function readState(project:Project){
  const file=path.join(project.path,".ai-kit","office-state.json");
  if(!fs.existsSync(file))return null;
  try{
    const state=JSON.parse(fs.readFileSync(file,"utf8"));
    return {...state,projectId:project.id,projectName:state.projectName||project.name,projectPath:project.path,
      agents:(state.agents||[]).map((a:any)=>({...a,displayName:settings.agentNamesByProject?.[project.id]?.[a.id]||a.role}))};
  }catch{return null;}
}
function pushState(project:Project){const s=readState(project);if(s)broadcast({type:"state",data:s});}

function readWorkbench(project:Project){
  const file=path.join(project.path,".ai-kit","office-workbench.json");
  if(!fs.existsSync(file))return null;
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return null;}
}
function pushWorkbench(project:Project){const w=readWorkbench(project);if(w)broadcast({type:"workbench",data:w});}

function readCoverage(project:Project){const file=path.join(project.path,".ai-kit","project-coverage.json");if(!fs.existsSync(file))return null;try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return null;}}
function pushCoverage(project:Project){const c=readCoverage(project);if(c)broadcast({type:"coverage",data:c});}
function readFeatureContracts(project:Project){const file=path.join(project.path,".ai-kit","office-feature-contracts.json");if(!fs.existsSync(file))return null;try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return null;}}
function pushFeatureContracts(project:Project){const f=readFeatureContracts(project);if(f)broadcast({type:"feature_contracts",data:f});}

function readAgentAnalytics(project:Project){
  const file=path.join(project.path,".ai-kit","office-agent-analytics.json");
  if(!fs.existsSync(file))return null;
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return null;}
}
function pushAgentAnalytics(project:Project){const a=readAgentAnalytics(project);if(a)broadcast({type:"agent_analytics",data:a});}

function saveFeatureDecision(projectId:string,featureId:string,key:string,answer:string){
 const project=projects.find(p=>p.id===projectId);if(!project)throw new Error("Project not found.");
 if(!["yes","no","deferred","required","excluded"].includes(answer))throw new Error("Invalid feature decision.");
 const file=path.join(project.path,".ai-kit","feature-decisions.json");let data:any={};try{data=JSON.parse(fs.readFileSync(file,"utf8"));}catch{}
 data[featureId]=data[featureId]||{};data[featureId][key]=answer;fs.writeFileSync(file,JSON.stringify(data,null,2));
 const contractsFile=path.join(project.path,".ai-kit","office-feature-contracts.json");
 try{
   const state=JSON.parse(fs.readFileSync(contractsFile,"utf8"));
   for(const contract of state.contracts||[]){
     if(contract.id!==featureId)continue;
     for(const question of contract.questions||[]){
       const qKey=String(question.id||"").includes(":")?String(question.id).split(":").slice(1).join(":"):String(question.key||"");
       if(qKey===key||question.id===`${featureId}:${key}`){
         question.status="answered";
         question.answer=answer;
       }
     }
   }
   state.openQuestions=(state.contracts||[]).reduce((n:number,c:any)=>n+(c.questions||[]).filter((q:any)=>q.status==="open").length,0);
   fs.writeFileSync(contractsFile,JSON.stringify(state,null,2));
 }catch{}
 pushFeatureContracts(project);
 emitProjectEvent(project,"ceo","CEO","decision_required","done",featureId,`Feature decision saved: ${featureId}.${key} = ${answer}`);
}



function pumpEvents(project:Project){
  const file=path.join(project.path,".ai-kit","events.jsonl");
  if(!fs.existsSync(file))return;
  const stat=fs.statSync(file);let offset=eventOffsets.get(project.id)??stat.size;
  if(stat.size<offset)offset=0;
  if(stat.size===offset){eventOffsets.set(project.id,offset);return;}
  const fd=fs.openSync(file,"r"),buffer=Buffer.alloc(stat.size-offset);
  fs.readSync(fd,buffer,0,buffer.length,offset);fs.closeSync(fd);eventOffsets.set(project.id,stat.size);
  for(const line of buffer.toString("utf8").split(/\r?\n/).filter(Boolean)){
    try{broadcast({type:"event",data:{...JSON.parse(line),project_id:project.id}});}catch{}
  }
}

function stopWatch(id:string){watchers.get(id)?.close();watchers.delete(id);eventOffsets.delete(id);}
function watchProject(project:Project){
  stopWatch(project.id);if(!project.enabled||!fs.existsSync(project.path))return;
  const ai=path.join(project.path,".ai-kit");fs.mkdirSync(ai,{recursive:true});
  try{
    const watcher=fs.watch(ai,{persistent:true},(_e,f)=>{
      if(!f)return;const n=f.toString();if(n==="office-state.json"){pushState(project);pushSkills(project);}if(n==="office-workbench.json")pushWorkbench(project);if(n==="project-coverage.json")pushCoverage(project);if(n==="office-feature-contracts.json")pushFeatureContracts(project);if(n==="office-agent-analytics.json")pushAgentAnalytics(project);if(n==="events.jsonl")pumpEvents(project);
    });watchers.set(project.id,watcher);
  }catch{}
  pushState(project);pushWorkbench(project);pushCoverage(project);pushFeatureContracts(project);pushAgentAnalytics(project);pushSkills(project);const ef=path.join(ai,"events.jsonl");if(fs.existsSync(ef))eventOffsets.set(project.id,fs.statSync(ef).size);
}
function refreshWatchers(){
  for(const id of [...watchers.keys()])if(!projects.some(p=>p.id===id&&p.enabled))stopWatch(id);
  for(const p of projects)watchProject(p);
}
function addProject(rawPath:string,rawName?:string|null){
  const projectPath=path.resolve(rawPath);if(!fs.existsSync(projectPath))throw new Error("Project path does not exist.");
  const existing=projects.find(p=>path.resolve(p.path)===projectPath);
  if(existing){existing.enabled=true;if(rawName)existing.name=rawName;}
  else{const base=slug(path.basename(projectPath));let id=base,n=2;while(projects.some(p=>p.id===id))id=`${base}-${n++}`;
    projects.push({id,name:rawName||path.basename(projectPath),path:projectPath,enabled:true,provider:"auto",runnerTrusted:false});
    settings.agentNamesByProject=settings.agentNamesByProject||{};
    settings.agentNamesByProject[id]={ceo:"CEO",pm:"PM",architect:"Architect",backend:"Backend",frontend:"Frontend",database:"Database",qa:"QA",security:"Security",devops:"DevOps",docs:"Docs"};
    saveJson(settingsFile,settings);
  }
  saveJson(projectsFile,projects);refreshWatchers();pushProjects();pushRunner();
}
function removeProject(id:string){stopWatch(id);projects=projects.filter(p=>p.id!==id);saveJson(projectsFile,projects);pushProjects();pushRunner();}

function setProjectTrust(id:string,trusted:boolean){
  const p=projects.find(x=>x.id===id);if(!p)throw new Error("Project not found.");
  p.runnerTrusted=trusted;saveJson(projectsFile,projects);pushProjects();
  if(trusted)processQueue();
}

function setProjectProvider(id:string,provider:Provider){
  if(!["auto","cursor","claude"].includes(provider))throw new Error("Invalid provider");
  const p=projects.find(x=>x.id===id);if(!p)throw new Error("Project not found.");
  p.provider=provider;saveJson(projectsFile,projects);pushProjects();pushRunner();processQueue();
}
function nextSequence(projectId:string){
  return Math.max(0,...commandHistory.filter(x=>x.projectId===projectId).map(x=>Number(x.queueSequence||0)))+1;
}
function queueBase(projectId:string,command:string,extra:Partial<CommandHistory>={}){
  const project=projects.find(p=>p.id===projectId);if(!project)throw new Error("Project not found.");
  const normalizedCommand=String(command||"").trim().toLowerCase();
  if(READ_ONLY_COMMANDS.has(normalizedCommand)){
    const duplicate=commandHistory.find(x=>
      x.projectId===projectId &&
      String(x.command||"").trim().toLowerCase()===normalizedCommand &&
      ["queued","waiting_for_agent","planning","plan_ready","running","verifying"].includes(x.status)
    );
    if(duplicate){
      auditLog(projectId,"Office Queue","dedupe",command,"info",`Skipped duplicate ${command}; existing ${duplicate.status} request ${duplicate.id}.`);
      pushAuditTrail();pushHistory();
      return;
    }
  }
  const item:CommandHistory={id:crypto.randomUUID(),projectId:project.id,projectPath:project.path,command,status:"queued",
    createdAt:new Date().toISOString(),provider:project.provider||"auto",message:"Queued for Office runner",
    queueSequence:nextSequence(projectId),attempt:1,requiresPlan:["fix next","continue","fix finding","execute work item"].includes(command),...extra};
  commandHistory=[item,...commandHistory].slice(0,500);saveJson(historyFile,commandHistory);
  auditLog(projectId,"CEO","queue_command",item.workItemId||item.findingId||command,"info",`Queued ${command}`);
  pushAuditTrail();pushHistory();processQueue();
}


const CANCELLABLE_QUEUE_STATUSES=new Set(["queued","waiting_for_agent","plan_ready"]);

function cancelQueuedCommand(id:string,reason="Cancelled by user."){
  const item=commandHistory.find(x=>x.id===id);
  if(!item)throw new Error("Command not found.");
  if(!CANCELLABLE_QUEUE_STATUSES.has(item.status)){
    throw new Error(`Only queued/waiting tasks can be cancelled. Current status: ${item.status}.`);
  }
  item.status="cancelled";
  item.completedAt=new Date().toISOString();
  item.message=reason;
  item.blockedBy=[];
  saveJson(historyFile,commandHistory);
  auditLog(item.projectId,"Office Queue","cancel",item.workItemId||item.findingId||item.command,"info",reason);
  pushAuditTrail();pushHistory();processQueue();
}

function cancelQueuedCommands(projectId:string,ids:string[]){
  const wanted=new Set(ids.map(String).filter(Boolean));
  let cancelled=0;
  for(const item of commandHistory){
    if(item.projectId!==projectId||!wanted.has(item.id)||!CANCELLABLE_QUEUE_STATUSES.has(item.status))continue;
    item.status="cancelled";
    item.completedAt=new Date().toISOString();
    item.message="Cancelled by user.";
    item.blockedBy=[];
    cancelled++;
    auditLog(projectId,"Office Queue","cancel",item.workItemId||item.findingId||item.command,"info","Cancelled selected queued task.");
  }
  if(cancelled){saveJson(historyFile,commandHistory);pushAuditTrail();pushHistory();processQueue();}
  return cancelled;
}

function cancelAllQueued(projectId:string){
  const ids=commandHistory.filter(x=>x.projectId===projectId&&CANCELLABLE_QUEUE_STATUSES.has(x.status)).map(x=>x.id);
  return cancelQueuedCommands(projectId,ids);
}

function canonicalQueueSnapshot(project:Project){
  const file=path.join(project.path,".ai-kit","backlog-canonical.json");
  try{
    const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
    return {
      openIds:new Set<string>(Array.isArray(parsed?.openTodos)?parsed.openTodos.map((x:any)=>String(x?.id||"")).filter(Boolean):[]),
      supersededIds:new Set<string>(Array.isArray(parsed?.supersededLiveIds)?parsed.supersededLiveIds.map(String):[])
    };
  }catch{
    return {openIds:new Set<string>(),supersededIds:new Set<string>()};
  }
}

function clearStaleQueue(projectId:string){
  const project=projects.find(p=>p.id===projectId);
  if(!project)throw new Error("Project not found.");
  const canonical=canonicalQueueSnapshot(project);
  let cancelled=0;
  for(const item of commandHistory){
    if(item.projectId!==projectId||!CANCELLABLE_QUEUE_STATUSES.has(item.status))continue;
    const workId=String(item.workItemId||"");
    if(!workId)continue;
    const stale=
      workId.startsWith("FC-") ||
      canonical.supersededIds.has(workId) ||
      (canonical.openIds.size>0&&item.command==="execute work item"&&!canonical.openIds.has(workId));
    if(!stale)continue;
    item.status="cancelled";
    item.completedAt=new Date().toISOString();
    item.message="Cancelled as stale queue item; not actionable in canonical backlog.";
    item.blockedBy=[];
    cancelled++;
    auditLog(projectId,"Office Queue","clear_stale",workId,"info","Cancelled stale queued work not present in canonical backlog.");
  }
  if(cancelled){saveJson(historyFile,commandHistory);pushAuditTrail();pushHistory();processQueue();}
  return cancelled;
}


const RESPONSE_LANGUAGES=new Set(["tr","en","de","ru","auto"]);

function readProjectResponseLanguage(projectId:string){
  const project=projects.find(p=>p.id===projectId);
  if(!project)throw new Error("Project not found.");
  const settingsPath=path.join(project.path,".ai-kit","settings.json");
  try{
    const parsed=JSON.parse(fs.readFileSync(settingsPath,"utf8"));
    const value=String(parsed?.responseLanguage||"en");
    return RESPONSE_LANGUAGES.has(value)?value:"en";
  }catch{
    return "en";
  }
}

function writeProjectResponseLanguage(projectId:string,language:string){
  if(!RESPONSE_LANGUAGES.has(language))throw new Error(`Unsupported response language: ${language}`);
  const project=projects.find(p=>p.id===projectId);
  if(!project)throw new Error("Project not found.");
  const aiDir=path.join(project.path,".ai-kit");
  const settingsPath=path.join(aiDir,"settings.json");
  fs.mkdirSync(aiDir,{recursive:true});

  let settings:any={};
  try{settings=JSON.parse(fs.readFileSync(settingsPath,"utf8"));}catch{}
  settings.responseLanguage=language;
  if(typeof settings.codeLanguage!=="string")settings.codeLanguage="en";
  if(typeof settings.commentsLanguage!=="string")settings.commentsLanguage="en";
  if(typeof settings.docsLanguage!=="string")settings.docsLanguage="en";
  fs.writeFileSync(settingsPath,JSON.stringify(settings,null,2));

  auditLog(projectId,"Office Settings","response_language",language,"info",`AI response language changed to ${language}.`);
  pushAuditTrail();
  broadcast({type:"project_response_language",projectId,responseLanguage:language});
  return language;
}

function retryCommand(id:string){
  const item=commandHistory.find(x=>x.id===id);if(!item)throw new Error("Command not found.");
  item.status="queued";item.completedAt=null;item.startedAt=null;
  item.attempt=(item.attempt||1)+1;
  item.message="Re-queued by user.";
  saveJson(historyFile,commandHistory);pushHistory();processQueue();
}


function queueWorkItem(projectId:string,item:any){
  const type=String(item.type||"feature");
  const role=String(item.assignedRole||roleForFinding(`${type} ${item.title||""}`)[1]||"Backend");
  queueBase(projectId,"execute work item",{
    workItemId:String(item.id||""),
    workItemTitle:String(item.title||""),
    workItemType:type,
    assignedRole:role,
    leadRole:String(item.leadRole||role),
    collaboratorRoles:collaboratorsForWork(type,role,item.collaboratorRoles),
    collaboratorCodingRoles:Array.isArray(item.collaboratorCodingRoles)?item.collaboratorCodingRoles.map(String).filter(Boolean):[],
    executionMode:["solo","collaborative","competitive"].includes(String(item.executionMode))?String(item.executionMode) as any:"collaborative",
    message:`CEO queued ${item.id} for ${role}`
  });
}
function queueWorkItems(projectId:string,items:any[]){
  const p=projects.find(x=>x.id===projectId);if(!p)throw new Error("Project not found.");
  const groupId=crypto.randomUUID();
  const sprintId=groupId;
  let sequence=nextSequence(projectId);
  const created:CommandHistory[]=[];
  const resolvedItems=inferDependencies(items);
  for(const item of resolvedItems){
    const type=String(item.type||"feature");
    const [,fallbackRole]=roleForFinding(`${type} ${item.title||""}`);
    const role=String(item.assignedRole||fallbackRole||"Backend");
    created.push({
      id:crypto.randomUUID(),projectId,projectPath:p.path,command:"execute work item",status:"queued",
      createdAt:new Date().toISOString(),provider:p.provider||"auto",
      message:`CEO queued ${item.id} for ${role}`,assignedRole:role,
      leadRole:String(item.leadRole||role),collaboratorRoles:collaboratorsForWork(type,role,item.collaboratorRoles),
      collaboratorCodingRoles:Array.isArray(item.collaboratorCodingRoles)?item.collaboratorCodingRoles.map(String).filter(Boolean):[],
      executionMode:["solo","collaborative","competitive"].includes(String(item.executionMode))?String(item.executionMode) as any:"collaborative",
      workItemId:String(item.id||""),workItemTitle:String(item.title||""),workItemType:type,
      queueGroupId:groupId,queueSequence:sequence++,attempt:1,requiresPlan:true,
      executionLane:normalizeLane(role),sprintId,sprintLabel:`${role} work sprint`,
      dependencyIds:item.dependencyIds||[],blockedBy:[],qualityGateStatus:"pending"
    });
  }
  commandHistory=[...created.reverse(),...commandHistory].slice(0,500);
  saveJson(historyFile,commandHistory);pushHistory();processQueue();
}

function queueFinding(projectId:string,id:string,title:string){
  const [,role]=roleForFinding(title);queueBase(projectId,"fix finding",{findingId:id,findingTitle:title,assignedRole:role,leadRole:role,collaboratorRoles:["QA"].filter(x=>x!==role),executionMode:"collaborative",message:`CEO queued ${id} for ${role}`});
}
function queueFindings(projectId:string,findings:any[]){
  const p=projects.find(x=>x.id===projectId);if(!p)throw new Error("Project not found.");
  const groupId=crypto.randomUUID();
  let sequence=nextSequence(projectId);

  const newItems:CommandHistory[]=[];
  for(const f of findings){
    const [,role]=roleForFinding(String(f.title||""));
    newItems.push({
      id:crypto.randomUUID(),projectId,projectPath:p.path,command:"fix finding",status:"queued",
      createdAt:new Date().toISOString(),provider:p.provider||"auto",
      message:`CEO queued ${f.id} for ${role}`,findingId:String(f.id),
      findingTitle:String(f.title),assignedRole:role,leadRole:role,collaboratorRoles:["QA"].filter(x=>x!==role),executionMode:"collaborative",queueGroupId:groupId,
      queueSequence:sequence++,attempt:1,requiresPlan:true,
      executionLane:normalizeLane(role),sprintId:groupId,sprintLabel:"finding sprint",
      dependencyIds:[],blockedBy:[],qualityGateStatus:"pending"
    });
  }

  // History is newest-first for UI; execution uses explicit queueSequence.
  commandHistory=[...newItems.reverse(),...commandHistory].slice(0,500);
  saveJson(historyFile,commandHistory);pushHistory();processQueue();
}


function cadenceMs(cadence:"off"|"daily"|"weekly"){
  if(cadence==="daily")return 24*60*60*1000;
  if(cadence==="weekly")return 7*24*60*60*1000;
  return 0;
}
function setScheduledAudit(projectId:string,id:string,label:string,command:string,cadence:"off"|"daily"|"weekly",enabled:boolean){
  settings.scheduledAudits=settings.scheduledAudits||[];
  const existing=settings.scheduledAudits.find(x=>x.projectId===projectId&&x.id===id);
  const now=Date.now(),ms=cadenceMs(cadence);
  const nextRunAt=enabled&&ms?new Date(now+ms).toISOString():null;
  if(existing){
    Object.assign(existing,{label,command,cadence,enabled,nextRunAt});
  }else{
    settings.scheduledAudits.push({id,projectId,label,command,cadence,enabled,nextRunAt,lastRunAt:null});
  }
  saveJson(settingsFile,settings);pushMissionSettings();
}
function runDueAudits(){
  const now=Date.now();
  for(const audit of settings.scheduledAudits||[]){
    if(!audit.enabled||audit.cadence==="off"||!audit.nextRunAt)continue;
    if(Date.parse(audit.nextRunAt)>now)continue;
    const project=projects.find(p=>p.id===audit.projectId&&p.enabled);
    if(!project)continue;
    queueBase(project.id,audit.command,{assignedRole:"Governance",message:`Scheduled audit: ${audit.label}`,requiresPlan:false,executionLane:"governance"});
    audit.lastRunAt=new Date(now).toISOString();
    audit.nextRunAt=new Date(now+cadenceMs(audit.cadence)).toISOString();
  }
  saveJson(settingsFile,settings);
}
function readTaskReport(commandId:string){
  const item=commandHistory.find(c=>c.id===commandId);if(!item?.taskReportPath)return null;
  const project=projects.find(p=>p.id===item.projectId);if(!project)return null;
  const full=path.resolve(project.path,item.taskReportPath);
  const allowed=path.resolve(project.path,".ai-kit","task-reports");
  if(!full.startsWith(allowed))return null;
  try{return JSON.parse(fs.readFileSync(full,"utf8"));}catch{return null;}
}

wss.on("connection",socket=>{
  socket.send(JSON.stringify({type:"projects",data:projects}));
  socket.send(JSON.stringify({type:"onboarding",data:onboardingSnapshot()}));
  socket.send(JSON.stringify({type:"command_history",data:historyForClient(commandHistory)}));
  socket.send(JSON.stringify({type:"runner_status",data:runnerStatus()}));
  socket.send(JSON.stringify({type:"agent_names",data:settings.agentNamesByProject||{}}));
  socket.send(JSON.stringify({type:"mission_settings",data:missionSettingsSnapshot()}));
  socket.send(JSON.stringify({type:"audit_trail",data:readAuditTrail()}));
  socket.send(JSON.stringify({type:"recovery",data:recoverySnapshot()}));
  socket.send(JSON.stringify({type:"retention",data:settings.retention}));
  socket.send(JSON.stringify({type:"runtime_sessions",data:runtimeProcesses.list()}));
  socket.send(JSON.stringify({type:"provider_health",data:providerHealthSnapshot()}));
  getKitEngineSnapshot().then(data=>socket.send(JSON.stringify({type:"kit_engine",data}))).catch(error=>socket.send(JSON.stringify({type:"kit_engine_error",data:{message:String(error?.message||error)}})));
  universalProviderSnapshot().then(data=>socket.send(JSON.stringify({type:"universal_provider_runtime",data}))).catch(error=>socket.send(JSON.stringify({type:"universal_provider_error",data:{message:String(error?.message||error)}})));
  for(const p of projects.filter(x=>x.enabled)){const s=readState(p);if(s)socket.send(JSON.stringify({type:"state",data:s}));const w=readWorkbench(p);if(w)socket.send(JSON.stringify({type:"workbench",data:w}));const c=readCoverage(p);if(c)socket.send(JSON.stringify({type:"coverage",data:c}));const f=readFeatureContracts(p);if(f)socket.send(JSON.stringify({type:"feature_contracts",data:f}));const a=readAgentAnalytics(p);if(a)socket.send(JSON.stringify({type:"agent_analytics",data:a}));socket.send(JSON.stringify({type:"skills",data:skillsSnapshot(p)}));}

  socket.on("message",async raw=>{
    try{
      const m=JSON.parse(raw.toString());
      if(m.action==="get_projects")socket.send(JSON.stringify({type:"projects",data:projects}));
      else if(m.action==="get_onboarding")socket.send(JSON.stringify({type:"onboarding",data:onboardingSnapshot()}));
      else if(m.action==="set_onboarding_complete"){
        settings.onboardingComplete=m.complete!==false;
        saveJson(settingsFile,settings);
        socket.send(JSON.stringify({type:"onboarding",data:onboardingSnapshot()}));
      }
      else if(m.action==="get_audit")socket.send(JSON.stringify({type:"audit_trail",data:readAuditTrail()}));
      else if(m.action==="get_recovery")socket.send(JSON.stringify({type:"recovery",data:recoverySnapshot()}));
      else if(m.action==="cleanup_recovery")socket.send(JSON.stringify({type:"recovery",data:cleanupStaleWorktrees()}));
      else if(m.action==="recover_command"){recoverInterruptedCommand(String(m.command_id||""));socket.send(JSON.stringify({type:"recovery",data:recoverySnapshot()}));}
      else if(m.action==="discard_recovery"){discardInterruptedCommand(String(m.command_id||""));socket.send(JSON.stringify({type:"recovery",data:recoverySnapshot()}));}
      else if(m.action==="get_release_gate"){
        const project=projects.find(p=>p.id===String(m.project_id||""));
        if(!project)throw new Error("No project selected for release gate.");
        socket.send(JSON.stringify({type:"release_gate",data:releaseGateSnapshot(project)}));
      }
      else if(m.action==="get_doctor"){
        const project=projects.find(p=>p.id===String(m.project_id||""));
        if(!project)throw new Error("No project selected for doctor.");
        socket.send(JSON.stringify({type:"doctor",data:doctorSnapshot(project)}));
      }
      else if(m.action==="set_retention"){settings.retention={reportsDays:Math.max(1,Number(m.reportsDays||30)),auditDays:Math.max(1,Number(m.auditDays||90)),worktreeDays:Math.max(1,Number(m.worktreeDays||7))};saveJson(settingsFile,settings);socket.send(JSON.stringify({type:"retention",data:settings.retention}));}
      else if(m.action==="run_retention_cleanup"){retentionCleanup();socket.send(JSON.stringify({type:"retention",data:settings.retention}));pushAuditTrail();}
      else if(m.action==="export_backup")socket.send(JSON.stringify({type:"backup_result",data:exportOfficeBackup()}));
      else if(m.action==="release_action"){
        const action=String(m.release_action||"leave_uncommitted") as "branch"|"commit"|"pr"|"leave_uncommitted";
        if(!["branch","commit","pr","leave_uncommitted"].includes(action))throw new Error("Invalid release action.");
        const result=runReleaseAction(String(m.project_id||""),action,m.message?String(m.message):undefined);
        socket.send(JSON.stringify({type:"release_action_result",data:result}));
        const project=projects.find(p=>p.id===String(m.project_id||""));if(project)socket.send(JSON.stringify({type:"release_gate",data:releaseGateSnapshot(project)}));
      }
      else if(m.action==="get_account_connections"){socket.send(JSON.stringify({type:"account_connections",data:await accountConnectionSnapshot()}));}
      else if(m.action==="login_account_connection"){socket.send(JSON.stringify({type:"account_login_started",data:launchAccountLogin(String(m.data?.id||""))}));}
      else if(m.action==="get_account_connection_status"){socket.send(JSON.stringify({type:"account_connection_status",data:await accountConnectionStatus(String(m.data?.id||""))}));}
      else if(m.action==="get_final_acceptance"){socket.send(JSON.stringify({type:"final_acceptance",data:currentFinalAcceptance()}));}
      else if(m.action==="get_version_consistency"){socket.send(JSON.stringify({type:"version_consistency",data:versionConsistency()}));}
      else if(m.action==="get_package_integrity"){socket.send(JSON.stringify({type:"package_integrity",data:packageIntegrity()}));}
      else if(m.action==="update_final_acceptance"){socket.send(JSON.stringify({type:"final_acceptance_updated",data:updateFinalAcceptance(m.data)}));}
      else if(m.action==="get_rc_security_snapshot"){socket.send(JSON.stringify({type:"rc_security_snapshot",data:rcSecuritySnapshot()}));}
      else if(m.action==="create_runtime_backup"){socket.send(JSON.stringify({type:"runtime_backup_created",data:createBackup()}));}
      else if(m.action==="restore_runtime_backup"){socket.send(JSON.stringify({type:"runtime_backup_restored",data:restoreBackup(String(m.data?.backupPath||""))}));}
      else if(m.action==="migrate_runtime_state"){socket.send(JSON.stringify({type:"runtime_migration_result",data:runtimeMigration()}));}
      else if(m.action==="get_upgrade_compatibility"){socket.send(JSON.stringify({type:"upgrade_compatibility",data:upgradeCompatibility()}));}
      else if(m.action==="get_last_known_good"){socket.send(JSON.stringify({type:"last_known_good",data:getLastKnownGood()}));}
      else if(m.action==="save_last_known_good"){socket.send(JSON.stringify({type:"last_known_good_saved",data:saveLastKnownGood(m.data)}));}
      else if(m.action==="get_callme_validation_readiness"){socket.send(JSON.stringify({type:"callme_validation_readiness",data:callMeReadinessSnapshot(String(m.data?.projectPath||process.env.OFFICE_PROJECT_PATH||""))}));}
      else if(m.action==="run_callme_validation"){socket.send(JSON.stringify({type:"callme_validation_result",data:await executeCallMeValidation(String(m.data?.projectPath||process.env.OFFICE_PROJECT_PATH||""))}));}
      else if(m.action==="get_integration_readiness"){socket.send(JSON.stringify({type:"integration_readiness",data:await integrationReadiness(String(m.data?.projectPath||process.env.OFFICE_PROJECT_PATH||"")||null)}));}
      else if(m.action==="get_integration_history"){socket.send(JSON.stringify({type:"integration_history",data:integrationHistory(Number(m.data?.limit||200))}));}
      else if(m.action==="get_desktop_runtime_status"){socket.send(JSON.stringify({type:"desktop_runtime_status",data:desktopRuntimeStatus()}));}
      else if(m.action==="execute_real_project_mission"){socket.send(JSON.stringify({type:"real_project_execution",data:await executeRealProjectMission(m.data)}));}
      else if(m.action==="inspect_project_docs"){socket.send(JSON.stringify({type:"project_docs_snapshot",data:inspectProjectDocs(String(m.data?.projectPath||""))}));}
      else if(m.action==="bootstrap_project_docs"){socket.send(JSON.stringify({type:"project_docs_bootstrapped",data:bootstrapDocs(m.data)}));}
      else if(m.action==="record_project_progress"){socket.send(JSON.stringify({type:"project_progress_recorded",data:recordProgress(m.data)}));}
      else if(m.action==="get_adaptive_routing"){socket.send(JSON.stringify({type:"adaptive_routing",data:adaptiveRoutingSnapshot()}));}
      else if(m.action==="get_mission_evidence"){socket.send(JSON.stringify({type:"mission_evidence",data:evidenceList(Number(m.data?.limit||100))}));}
      else if(m.action==="get_mission_evidence_item"){socket.send(JSON.stringify({type:"mission_evidence_item",data:evidenceItem(String(m.data?.missionId||""))}));}
      else if(m.action==="get_approval_inbox"){socket.send(JSON.stringify({type:"approval_inbox",data:approvalInbox()}));}
      else if(m.action==="decide_approval"){socket.send(JSON.stringify({type:"approval_decision",data:decideApproval(String(m.data?.id||""),String(m.data?.status||"rejected") as any)}));}
      else if(m.action==="get_mission_replay"){socket.send(JSON.stringify({type:"mission_replay",data:missionReplay(String(m.data?.missionId||""))}));}
      else if(m.action==="get_mission_history"){socket.send(JSON.stringify({type:"mission_history",data:missionHistory(Number(m.data?.limit||100))}));}
      else if(m.action==="get_mission_history_item"){socket.send(JSON.stringify({type:"mission_history_item",data:missionHistoryItem(String(m.data?.missionId||""))}));}
      else if(m.action==="execute_autonomous_mission"){
        const project=projects.find(p=>p.id===String(m.data?.projectId||m.data?.project_id||""));
        const goal=String(m.data?.goal||"").trim();
        const reportedBy=String(m.data?.reportedBy||"").trim();
        const reporterId=String(m.data?.reporterId||"").trim();
        if(project&&goal&&reportedBy){
          const [,ceoRole]=roleForFinding(goal);
          if(!/^ceo$/i.test(reportedBy)&&!/^ceo$/i.test(reporterId)){
            emitProjectEvent(project,reporterId||reportedBy.toLowerCase(),reportedBy,"handoff","thinking",goal,
              `Boss, this work came in.`);
          }
          emitProjectEvent(project,"ceo","CEO","task_started","planning",goal,
            `Reported by ${reportedBy}. Assigning to ${ceoRole}.`);
        }
        broadcast({type:"autonomous_mission_event",data:{type:"mission.started",at:new Date().toISOString(),message:"Mission accepted",data:m.data||{}}});
        socket.send(JSON.stringify({type:"autonomous_mission_result",data:await getAutonomousExecutionLoop().execute({
          ...(m.data||{}),
          preferredProvider:m.data?.preferredProvider||project?.provider||null,
          projectProvider:project?.provider||null
        })}));
      }
      else if(m.action==="cancel_autonomous_mission"){socket.send(JSON.stringify({type:"autonomous_mission_cancelled",data:{ok:getAutonomousExecutionLoop().cancel(String(m.data?.missionId||"")),missionId:String(m.data?.missionId||"")}}));}
      else if(m.action==="get_provider_credentials"){socket.send(JSON.stringify({type:"provider_credentials",data:credentialSnapshot()}));}
      else if(m.action==="save_provider_credential"){socket.send(JSON.stringify({type:"provider_credentials",data:saveProviderCredential(m.data)}));applySecureCredentialsToProcess();}
      else if(m.action==="delete_provider_credential"){socket.send(JSON.stringify({type:"provider_credentials",data:deleteProviderCredential(String(m.data?.providerId||""))}));}
      else if(m.action==="test_provider_connection"){socket.send(JSON.stringify({type:"provider_connection_test",data:await testProviderConnection(String(m.data?.providerId||""))}));}
      else if(m.action==="plan_autonomous_provider_mission"){socket.send(JSON.stringify({type:"autonomous_provider_plan",data:await planAutonomousProviderMission(m.data)}));}
      else if(m.action==="get_provider_assignments"){socket.send(JSON.stringify({type:"provider_assignments",data:providerAssignmentSnapshot()}));}
      else if(m.action==="set_agent_provider_pin"){socket.send(JSON.stringify({type:"provider_assignments",data:setAgentProviderPin(m.data)}));}
      else if(m.action==="remove_agent_provider_pin"){socket.send(JSON.stringify({type:"provider_assignments",data:removeAgentProviderPin(String(m.data?.agentId||""))}));}
      else if(m.action==="save_provider_policy"){socket.send(JSON.stringify({type:"provider_assignments",data:saveProviderPolicy(m.data)}));}
      else if(m.action==="route_with_provider_policy"){socket.send(JSON.stringify({type:"provider_route_evidence",data:await routeWithPolicy(m.data)}));}
      else if(m.action==="get_universal_providers"){socket.send(JSON.stringify({type:"universal_provider_runtime",data:await universalProviderSnapshot()}));}
      else if(m.action==="route_universal_provider"){socket.send(JSON.stringify({type:"universal_provider_route",data:await universalProviderRoute(m.data)}));}
      else if(m.action==="execute_universal_provider"){socket.send(JSON.stringify({type:"universal_provider_execution",data:await universalProviderExecute(m.data)}));}
      else if(m.action==="stream_universal_provider"){socket.send(JSON.stringify({type:"universal_provider_stream",data:await universalProviderStream(m.data)}));}
      else if(m.action==="cancel_universal_provider_stream"){socket.send(JSON.stringify({type:"universal_provider_stream_cancelled",data:{ok:cancelUniversalProviderStream(String(m.data?.streamId||"")),streamId:String(m.data?.streamId||"")}}));}
      else if(m.action==="get_kit_engine"){socket.send(JSON.stringify({type:"kit_engine",data:await getKitEngineSnapshot()}));}
      else if(m.action==="validate_kit_engine"){socket.send(JSON.stringify({type:"kit_engine_validation",data:await validateKitEngine()}));}
      else if(m.action==="resolve_kit_project"){
        const project=projects.find(p=>p.id===String(m.project_id||""));
        if(project)socket.send(JSON.stringify({type:"kit_project_resolution",projectId:project.id,data:await getProjectKitResolution(project.path)}));
      }
      else if(m.action==="sync_kit_project"){
        const project=projects.find(p=>p.id===String(m.project_id||""));
        if(project){await createKitEngine().syncProject(project.path);socket.send(JSON.stringify({type:"kit_project_synced",projectId:project.id,data:{ok:true}}));}
      }
      else if(m.action==="get_skills"){
        const project=projects.find(p=>p.id===String(m.project_id||""));
        if(!project)throw new Error("No project selected for skills.");
        socket.send(JSON.stringify({type:"skills",data:skillsSnapshot(project)}));
      }
      else if(m.action==="set_skill_enabled")setSkillEnabled(String(m.project_id||""),String(m.skill_id||""),!!m.enabled);
      else if(m.action==="get_runner_status")socket.send(JSON.stringify({type:"runner_status",data:runnerStatus(String(m.project_id||""))}));
      else if(m.action==="add_project")addProject(String(m.path||""),m.name?String(m.name):null);
      else if(m.action==="remove_project")removeProject(String(m.project_id||""));
      else if(m.action==="set_project_provider")setProjectProvider(String(m.project_id||""),String(m.provider||"auto") as Provider);
      else if(m.action==="set_project_trust")setProjectTrust(String(m.project_id||""),!!m.trusted);
      else if(m.action==="dismiss_inbox_item"){
        const item=commandHistory.find(c=>c.id===String(m.command_id||""));
        if(!item)throw new Error("Command not found.");
        item.inboxDismissed=true;
        saveJson(historyFile,commandHistory);pushHistory();
      }
      else if(m.action==="retry_command_solo"){
        const prev=commandHistory.find(c=>c.id===String(m.command_id||""));
        if(!prev)throw new Error("Command not found.");
        queueBase(prev.projectId,prev.command,{
          executionMode:"solo",
          workItemId:prev.workItemId,
          workItemTitle:prev.workItemTitle,
          findingId:prev.findingId,
          findingTitle:prev.findingTitle,
          assignedRole:prev.assignedRole,
          leadRole:prev.leadRole,
          requiresPlan:prev.requiresPlan,
          mergeGateStatus:"not_required"
        });
      }
      else if(m.action==="queue_command"){
        const role=String(m.assignedRole||m.assigned_role||m.data?.assignedRole||"").trim();
        queueBase(String(m.project_id||m.data?.projectId||""),String(m.command||m.data?.command||""),role?{
          assignedRole:role,
          leadRole:role,
          message:`Queued for ${role}`
        }:{});
      }
      else if(m.action==="queue_finding")queueFinding(String(m.project_id||""),String(m.finding_id||""),String(m.finding_title||""));
      else if(m.action==="queue_work_item")queueWorkItem(String(m.project_id||""),m.item||{});
      else if(m.action==="queue_work_items")queueWorkItems(String(m.project_id||""),Array.isArray(m.items)?m.items:[]);
      else if(m.action==="answer_feature_decision")saveFeatureDecision(String(m.project_id||""),String(m.feature_id||""),String(m.key||""),String(m.answer||""));
      else if(m.action==="queue_findings")queueFindings(String(m.project_id||""),Array.isArray(m.findings)?m.findings:[]);
      else if(m.action==="cancel_command")cancelQueuedCommand(String(m.command_id||""));
      else if(m.action==="cancel_commands")cancelQueuedCommands(String(m.project_id||""),Array.isArray(m.command_ids)?m.command_ids.map(String):[]);
      else if(m.action==="cancel_all_queued")cancelAllQueued(String(m.project_id||""));
      else if(m.action==="clear_stale_queue")clearStaleQueue(String(m.project_id||""));
      else if(m.action==="get_project_response_language"){
        const projectId=String(m.project_id||"");
        broadcast({type:"project_response_language",projectId,responseLanguage:readProjectResponseLanguage(projectId)});
      }
      else if(m.action==="set_project_response_language"){
        writeProjectResponseLanguage(String(m.project_id||""),String(m.response_language||""));
      }
      else if(m.action==="runtime_list"){
        socket.send(JSON.stringify({type:"runtime_sessions",data:runtimeProcesses.list(m.project_id?String(m.project_id):undefined)}));
      }
      else if(m.action==="runtime_spawn"){
        const snapshot=spawnRuntimeAgent(
          String(m.project_id||""),
          String(m.provider||"auto"),
          String(m.agent_id||""),
          String(m.role||"general"),
          m.resume_token?String(m.resume_token):null,
          m.task?String(m.task):null
        );
        socket.send(JSON.stringify({type:"runtime_spawned",data:snapshot}));
      }
      else if(m.action==="runtime_write"){
        const session=runtimeProcesses.get(String(m.session_id||""));
        if(!session)throw new Error("Runtime session not found.");
        const p=officeProject(session.projectId);
        const auth=authorizationService.authorize({projectId:p.id,projectPath:p.path,actor:"user",action:"terminalWrite",policy:DEFAULT_PERMISSION_POLICY,profile:getSandboxProfile("guarded"),approvalId:m.approval_id?String(m.approval_id):null});
        if(!auth.allowed){socket.send(JSON.stringify({type:"safety_authorization_result",data:auth}));broadcast({type:"safety_v2_snapshot",projectId:p.id,data:safetyV2Snapshot(p.id)});return;}
        runtimeProcesses.write(String(m.session_id||""),String(m.data||""));
      }
      else if(m.action==="runtime_resize"){
        runtimeProcesses.resize(String(m.session_id||""),Number(m.cols||120),Number(m.rows||32));
      }
      else if(m.action==="runtime_terminate"){
        const session=runtimeProcesses.get(String(m.session_id||""));
        if(!session)throw new Error("Runtime session not found.");
        const p=officeProject(session.projectId);
        const auth=authorizationService.authorize({projectId:p.id,projectPath:p.path,actor:"user",action:"terminalTerminate",policy:DEFAULT_PERMISSION_POLICY,profile:getSandboxProfile("guarded"),approvalId:m.approval_id?String(m.approval_id):null});
        if(!auth.allowed){socket.send(JSON.stringify({type:"safety_authorization_result",data:auth}));broadcast({type:"safety_v2_snapshot",projectId:p.id,data:safetyV2Snapshot(p.id)});return;}
        runtimeProcesses.terminate(String(m.session_id||""));
      }
      else if(m.action==="runtime_terminate_project"){
        runtimeProcesses.terminateProject(String(m.project_id||""));
      }
      else if(m.action==="workspace_list"){socket.send(JSON.stringify({type:"workspace_files",projectId:String(m.project_id||""),data:workspaceList(String(m.project_id||""),String(m.path||""),Number(m.depth||3))}));}
      else if(m.action==="workspace_read"){
        try{socket.send(JSON.stringify({type:"workspace_file",data:workspaceRead(String(m.project_id||""),String(m.path||""))}));}
        catch(error){socket.send(JSON.stringify({type:"workspace_file_error",data:{path:String(m.path||""),message:error instanceof Error?error.message:String(error)}}));}
      }
      else if(m.action==="workspace_write"){
        const relativePath=String(m.path||"");
        try{
          const result=workspaceWrite(String(m.project_id||""),relativePath,String(m.content||""));
          socket.send(JSON.stringify({type:"workspace_saved",projectId:String(m.project_id||""),data:result}));
        }catch(error){
          socket.send(JSON.stringify({type:"workspace_file_error",data:{path:relativePath,message:`Save failed for ${relativePath||"file"}: ${error instanceof Error?error.message:String(error)}`}}));
        }
      }
      else if(m.action==="workspace_git_diff"){
        try{socket.send(JSON.stringify({type:"workspace_git_diff",projectId:String(m.project_id||""),data:workspaceDiff(String(m.project_id||""))}));}
        catch(error){socket.send(JSON.stringify({type:"workspace_git_diff",projectId:String(m.project_id||""),data:[],error:error instanceof Error?error.message:String(error)}));}
      }
      else if(m.action==="workspace_watch"){const projectId=String(m.project_id||"");socket.send(JSON.stringify({type:"workspace_watch_status",projectId,active:startWorkspaceWatch(projectId)}));}
      else if(m.action==="workspace_unwatch"){const projectId=String(m.project_id||"");workspaceWatcher.stop(projectId);socket.send(JSON.stringify({type:"workspace_watch_status",projectId,active:false}));}
      else if(m.action==="collaboration_snapshot"){
        socket.send(JSON.stringify({type:"collaboration_snapshot",projectId:String(m.project_id||""),data:collaborationSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="director_plan"){
        socket.send(JSON.stringify({type:"director_plan",data:directorPlan(String(m.project_id||""),String(m.goal||""))}));
      }
      else if(m.action==="collaboration_message"){
        socket.send(JSON.stringify({type:"collaboration_message",data:collaborationMessage(String(m.project_id||""),String(m.from_agent_id||"director"),String(m.to_agent_id||""),String(m.subject||""),String(m.body||""),m.related_task_id?String(m.related_task_id):null,Array.isArray(m.artifact_ids)?m.artifact_ids.map(String):[])}));
      }
      else if(m.action==="collaboration_mark_read"){
        const p=officeProject(String(m.project_id||""));
        const row=collaboration.store.markRead(p.id,p.path,String(m.message_id||""));
        socket.send(JSON.stringify({type:"collaboration_mark_read",projectId:p.id,data:row}));
        pushCollaboration(p.id);
      }
      else if(m.action==="collaboration_blackboard"){
        socket.send(JSON.stringify({type:"collaboration_blackboard",data:collaborationBlackboard(String(m.project_id||""),String(m.author_agent_id||"director"),String(m.category||"note"),String(m.title||""),String(m.body||""),m.related_task_id?String(m.related_task_id):null)}));
      }
      else if(m.action==="collaboration_artifact"){
        socket.send(JSON.stringify({type:"collaboration_artifact",data:collaborationArtifact(String(m.project_id||""),String(m.producer_agent_id||"director"),m.task_id?String(m.task_id):null,String(m.artifact_type||"report"),String(m.title||""),(m.payload&&typeof m.payload==="object")?m.payload:{})}));
      }
      else if(m.action==="collaboration_task_update"){
        const p=officeProject(String(m.project_id||""));
        collaboration.store.updateTask(p.id,p.path,String(m.task_id||""),(m.patch&&typeof m.patch==="object")?m.patch:{});
        pushCollaboration(p.id);
      }
      else if(m.action==="memory_snapshot"){
        socket.send(JSON.stringify({type:"memory_snapshot",projectId:String(m.project_id||""),data:memorySnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="memory_add"){
        socket.send(JSON.stringify({type:"memory_added",data:memoryAdd(
          String(m.project_id||""),
          String(m.scope||"shared"),
          m.agent_id?String(m.agent_id):null,
          String(m.kind||"fact"),
          String(m.title||""),
          String(m.body||""),
          Array.isArray(m.tags)?m.tags.map(String):[],
          m.related_task_id?String(m.related_task_id):null,
          Array.isArray(m.related_artifact_ids)?m.related_artifact_ids.map(String):[],
          Number(m.importance||50)
        )}));
      }
      else if(m.action==="memory_search"){
        socket.send(JSON.stringify({type:"memory_search_results",projectId:String(m.project_id||""),query:String(m.query||""),data:memorySearch(String(m.project_id||""),String(m.query||""),m.agent_id?String(m.agent_id):null,Number(m.limit||12))}));
      }
      else if(m.action==="memory_condense"){
        socket.send(JSON.stringify({type:"memory_condensed",projectId:String(m.project_id||""),data:memoryCondense(String(m.project_id||""),Number(m.max_items||80),Number(m.retention_days||180))}));
      }
      else if(m.action==="safety_snapshot"){
        socket.send(JSON.stringify({type:"safety_snapshot",projectId:m.project_id?String(m.project_id):undefined,data:safetySnapshot(m.project_id?String(m.project_id):undefined)}));
      }
      else if(m.action==="runtime_pause"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.pause(session.id,seed,String(m.message||"Paused manually.")));
      }
      else if(m.action==="runtime_resume"){
        const {session}=runtimeSafetySeed(String(m.session_id||""));
        safety.breaker.resume(session.id);
        runtimeProcesses.resume(session.id);
        pushSafety(session.projectId);
      }
      else if(m.action==="runtime_steer"){
        const {session}=runtimeSafetySeed(String(m.session_id||""));
        runtimeProcesses.steer(session.id,String(m.message||""));
      }
      else if(m.action==="runtime_constrain"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.constrain(session.id,seed,String(m.message||"Constrained manually.")));
      }
      else if(m.action==="runtime_usage"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.recordUsage(session.id,seed,Number(m.tokens||0),Number(m.cost_usd||0)));
      }
      else if(m.action==="runtime_command_observed"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.recordCommand(session.id,seed,String(m.command||"")));
      }
      else if(m.action==="runtime_progress_observed"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.recordProgress(session.id,seed,String(m.signature||"")));
      }
      else if(m.action==="runtime_safety_check"){
        const {session,seed}=runtimeSafetySeed(String(m.session_id||""));
        applySafetyIncident(safety.breaker.checkRuntime(session.id,seed));
      }
      else if(m.action==="provider_health"){
        socket.send(JSON.stringify({type:"provider_health",data:refreshProviderHealth()}));
      }
      else if(m.action==="provider_route"){
        socket.send(JSON.stringify({type:"provider_route_decision",data:providerRoute(String(m.task||""),m.role?String(m.role):null,m.preferred?String(m.preferred):null,Boolean(m.local_only))}));
      }
      else if(m.action==="provider_failover"){
        const current=String(m.current_provider||"cursor") as ProviderId;
        const next=providerEngine.failover(current,{task:String(m.task||""),role:m.role?String(m.role):null});
        socket.send(JSON.stringify({type:"provider_failover_decision",data:{current,next}}));
      }
      else if(m.action==="prerequisites_check"){socket.send(JSON.stringify({type:"prerequisites",data:checkPrerequisites()}));}
      else if(m.action==="prerequisite_install"){const data=installPrerequisite(String(m.id||"") as PrerequisiteId);socket.send(JSON.stringify({type:"prerequisite_install_result",data}));socket.send(JSON.stringify({type:"prerequisites",data:checkPrerequisites()}));}
      else if(m.action==="update_check"){socket.send(JSON.stringify({type:"update_info",data:updateCheck()}));}
      else if(m.action==="update_apply"){socket.send(JSON.stringify({type:"update_result",data:officeUpdater.apply(process.cwd())}));}
      else if(m.action==="choose_project_folder"){socket.send(JSON.stringify({type:"project_folder_selected",data:await chooseProjectFolder()}));}
      else if(m.action==="automation_snapshot"){
        socket.send(JSON.stringify({type:"automation_snapshot",projectId:String(m.project_id||""),data:automationSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="automation_create"){
        const p=officeProject(String(m.project_id||""));
        const cadence=String(m.cadence||"once") as MissionCadence;
        const mission=automationEngine.store.createMission(p.id,p.path,{
          title:String(m.title||"Scheduled mission"),
          prompt:String(m.prompt||""),
          provider:String(m.provider||"auto"),
          role:String(m.role||"general"),
          cadence,
          nextRunAt:m.next_run_at?String(m.next_run_at):undefined,
          maxRetries:Number(m.max_retries||2)
        });
        pushAutomation(p.id);
        socket.send(JSON.stringify({type:"automation_created",data:mission}));
      }
      else if(m.action==="automation_remove"){
        const p=officeProject(String(m.project_id||""));
        const ok=automationEngine.store.removeMission(p.path,String(m.mission_id||""));
        pushAutomation(p.id);
        socket.send(JSON.stringify({type:"automation_removed",data:{ok}}));
      }
      else if(m.action==="automation_run_due"){
        socket.send(JSON.stringify({type:"automation_run_result",data:await runAutomationDue(String(m.project_id||""))}));
      }
      else if(m.action==="heartbeat_configure"){
        const p=officeProject(String(m.project_id||""));
        const hb=automationEngine.store.heartbeat(p.id,p.path,{enabled:Boolean(m.enabled),intervalMinutes:Number(m.interval_minutes||15)});
        pushAutomation(p.id);
        socket.send(JSON.stringify({type:"heartbeat_configured",data:hb}));
      }
      else if(m.action==="heartbeat_now"){
        const p=officeProject(String(m.project_id||""));
        const hb=automationEngine.store.recordBeat(p.id,p.path);
        pushAutomation(p.id);
        socket.send(JSON.stringify({type:"heartbeat_result",data:hb}));
      }
      else if(m.action==="ledger_snapshot"){
        socket.send(JSON.stringify({type:"ledger_snapshot",projectId:String(m.project_id||""),data:ledgerSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="ledger_add"){
        const p=officeProject(String(m.project_id||""));
        const entry=ledgerStore.add(p.id,p.path,{
          provider:String(m.provider||"unknown"),
          agentId:String(m.agent_id||"unknown"),
          taskId:m.task_id?String(m.task_id):null,
          sessionId:m.session_id?String(m.session_id):null,
          inputTokens:Number(m.input_tokens||0),
          outputTokens:Number(m.output_tokens||0),
          estimatedCostUsd:Number(m.estimated_cost_usd||0),
          latencyMs:m.latency_ms===undefined?null:Number(m.latency_ms),
          durationMs:m.duration_ms===undefined?null:Number(m.duration_ms)
        });
        pushLedger(p.id);
        socket.send(JSON.stringify({type:"ledger_added",data:entry}));
      }
      else if(m.action==="plugins_snapshot"){
        socket.send(JSON.stringify({type:"plugins_snapshot",data:pluginSnapshot()}));
      }
      else if(m.action==="git_graph"){
        socket.send(JSON.stringify({type:"git_graph",projectId:String(m.project_id||""),data:gitGraphSnapshot(String(m.project_id||""),Number(m.limit||120))}));
      }
      else if(m.action==="git_working_tree"){
        socket.send(JSON.stringify({type:"git_working_tree",projectId:String(m.project_id||""),data:gitWorkingTree(String(m.project_id||""))}));
      }
      else if(m.action==="git_create_branch"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Git branch creation requires a trusted project.");
        const data=gitIntelligence.createBranch(p.path,String(m.name||""));
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"create_branch",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{name:String(m.name||"")}});
        socket.send(JSON.stringify({type:"git_graph",projectId:p.id,data}));
      }
      else if(m.action==="git_checkout"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Git checkout requires a trusted project.");
        const data=gitIntelligence.checkout(p.path,String(m.name||""));
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"checkout",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{name:String(m.name||"")}});
        socket.send(JSON.stringify({type:"git_graph",projectId:p.id,data}));
      }
      else if(m.action==="git_commit"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Git commit requires a trusted project.");
        const hash=gitIntelligence.commit(p.path,String(m.message||""),Array.isArray(m.paths)?m.paths.map(String):undefined);
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"commit",sourceTaskId:m.task_id?String(m.task_id):null,sourceSessionId:null,artifactPath:null,metadata:{hash,message:String(m.message||"")}});
        socket.send(JSON.stringify({type:"git_commit_result",data:{hash}}));
        socket.send(JSON.stringify({type:"git_graph",projectId:p.id,data:gitGraphSnapshot(p.id,120)}));
        socket.send(JSON.stringify({type:"git_working_tree",projectId:p.id,data:gitWorkingTree(p.id)}));
      }
      else if(m.action==="git_snapshot_create"){
        const p=officeProject(String(m.project_id||""));
        const meta=gitIntelligence.createSnapshot(p.id,p.path,String(m.label||"Snapshot"),m.include_working_tree!==false);
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"snapshot_create",sourceTaskId:null,sourceSessionId:null,artifactPath:meta.patchFile,metadata:{snapshotId:meta.id,label:meta.label}});
        socket.send(JSON.stringify({type:"git_snapshot_result",data:meta}));
        socket.send(JSON.stringify({type:"git_snapshots",projectId:p.id,data:gitSnapshots(p.id)}));
      }
      else if(m.action==="git_snapshots"){
        socket.send(JSON.stringify({type:"git_snapshots",projectId:String(m.project_id||""),data:gitSnapshots(String(m.project_id||""))}));
      }
      else if(m.action==="git_snapshot_restore"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Snapshot restore requires a trusted project.");
        const result=gitIntelligence.restoreSnapshot(p.path,String(m.snapshot_id||""));
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"snapshot_restore",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{snapshotId:String(m.snapshot_id||"")}});
        socket.send(JSON.stringify({type:"git_snapshot_restore_result",data:result}));
      }
      else if(m.action==="state_migrate"){
        const p=officeProject(String(m.project_id||""));
        const data=migrationService.migrateProject(p.path);
        provenanceStore.append(p.id,p.path,{type:"state",actor:"office",action:"schema_migrate",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{files:data}});
        socket.send(JSON.stringify({type:"state_migration_result",data}));
      }
      else if(m.action==="provenance_snapshot"){
        socket.send(JSON.stringify({type:"provenance_snapshot",projectId:String(m.project_id||""),data:provenanceSnapshot(String(m.project_id||""),Number(m.limit||500))}));
      }
      else if(m.action==="provenance_replay"){
        const p=officeProject(String(m.project_id||""));
        const replayed:Array<any>=[];
        const result=provenanceStore.replay(p.path,event=>replayed.push(event),Number(m.limit||1000));
        socket.send(JSON.stringify({type:"provenance_replay_result",data:{...result,events:replayed}}));
      }
      else if(m.action==="integrations_snapshot"){
        socket.send(JSON.stringify({type:"integrations_snapshot",projectId:String(m.project_id||""),data:integrationSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="integration_update"){
        const p=officeProject(String(m.project_id||""));
        const row=integrationRegistry.update(p.path,String(m.id||"") as IntegrationId,{
          enabled:Boolean(m.enabled),
          endpoint:m.endpoint?String(m.endpoint):null,
          tokenEnv:m.token_env?String(m.token_env):null,
          metadata:m.metadata&&typeof m.metadata==="object"?m.metadata:{}
        });
        socket.send(JSON.stringify({type:"integration_updated",data:row}));
        broadcast({type:"integrations_snapshot",projectId:p.id,data:integrationSnapshot(p.id)});
      }
      else if(m.action==="integration_test_webhook"){
        const p=officeProject(String(m.project_id||""));
        const cfg=integrationRegistry.load(p.path).find(x=>x.id===String(m.id||""));
        if(!cfg?.endpoint)throw new Error("Integration endpoint is missing.");
        const token=cfg.tokenEnv?process.env[cfg.tokenEnv]||null:null;
        const data=await postWebhook(cfg.endpoint,{event:"office.integration.test",projectId:p.id,data:{integration:cfg.id},createdAt:new Date().toISOString()},token);
        socket.send(JSON.stringify({type:"integration_test_result",data}));
      }
      else if(m.action==="mcp_upsert"){
        const p=officeProject(String(m.project_id||""));
        const row:McpServerConfig={
          id:String(m.id||""),
          command:String(m.command||""),
          args:Array.isArray(m.args)?m.args.map(String):[],
          env:m.env&&typeof m.env==="object"?m.env:{},
          enabled:m.enabled!==false
        };
        socket.send(JSON.stringify({type:"mcp_updated",data:mcpManager.upsert(p.path,row)}));
        broadcast({type:"integrations_snapshot",projectId:p.id,data:integrationSnapshot(p.id)});
      }
      else if(m.action==="mcp_remove"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"mcp_removed",data:{ok:mcpManager.remove(p.path,String(m.id||""))}}));
        broadcast({type:"integrations_snapshot",projectId:p.id,data:integrationSnapshot(p.id)});
      }
      else if(m.action==="workers_snapshot"){
        socket.send(JSON.stringify({type:"workers_snapshot",projectId:String(m.project_id||""),data:workerSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="worker_upsert"){
        const p=officeProject(String(m.project_id||""));
        const row:WorkerConfig={
          id:String(m.id||""),
          name:String(m.name||m.id||"Worker"),
          kind:String(m.kind||"local") as any,
          enabled:m.enabled!==false,
          host:m.host?String(m.host):null,
          user:m.user?String(m.user):null,
          port:m.port?Number(m.port):null,
          container:m.container?String(m.container):null,
          workdir:m.workdir?String(m.workdir):null,
          tags:Array.isArray(m.tags)?m.tags.map(String):[],
          maxConcurrent:Math.max(1,Math.min(32,Number(m.max_concurrent||1)))
        };
        socket.send(JSON.stringify({type:"worker_updated",data:workerRegistry.upsert(p.path,row)}));
        broadcast({type:"workers_snapshot",projectId:p.id,data:workerSnapshot(p.id)});
      }
      else if(m.action==="worker_remove"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"worker_removed",data:{ok:workerRegistry.remove(p.path,String(m.id||""))}}));
        broadcast({type:"workers_snapshot",projectId:p.id,data:workerSnapshot(p.id)});
      }
      else if(m.action==="worker_select"){
        const p=officeProject(String(m.project_id||""));
        const selected=workerPool.select(workerRegistry.list(p.path),Array.isArray(m.tags)?m.tags.map(String):[]);
        socket.send(JSON.stringify({type:"worker_selected",data:selected}));
      }
      else if(m.action==="replay_sessions"){
        socket.send(JSON.stringify({type:"replay_sessions",projectId:String(m.project_id||""),data:replaySnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="replay_session"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"replay_session",data:replayStore.read(p.path,String(m.session_id||""))}));
      }
      else if(m.action==="recovery_backup"){
        const p=officeProject(String(m.project_id||""));
        const root=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),"AppData","Local"),"AI-Development-Office","backups");
        const data=disasterRecovery.create(p.path,root);
        provenanceStore.append(p.id,p.path,{type:"state",actor:"office",action:"recovery_backup",sourceTaskId:null,sourceSessionId:null,artifactPath:data.backupPath,metadata:{files:data.files}});
        socket.send(JSON.stringify({type:"recovery_backup_result",data}));
      }
      else if(m.action==="recovery_restore"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Recovery restore requires a trusted project.");
        const data=disasterRecovery.restore(String(m.backup_path||""),p.path);
        socket.send(JSON.stringify({type:"recovery_restore_result",data}));
      }
      else if(m.action==="git_side_by_side"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_side_by_side",data:gitIntelligence.sideBySide(p.path,String(m.file||""),String(m.from||"HEAD"))}));
      }
      else if(m.action==="git_blame"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_blame",data:{file:String(m.file||""),lines:gitIntelligence.blame(p.path,String(m.file||""))}}));
      }
      else if(m.action==="git_conflicts"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_conflicts",data:gitIntelligence.conflicts(p.path)}));
      }
      else if(m.action==="git_conflict_inspect"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_conflict_inspection",data:mergeAssistant.inspect(p.path,String(m.file||""))}));
      }
      else if(m.action==="git_cherry_pick"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Cherry-pick requires a trusted project.");
        const hash=gitIntelligence.cherryPick(p.path,String(m.commit||""));
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"cherry_pick",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{hash,commit:String(m.commit||"")}});
        socket.send(JSON.stringify({type:"git_cherry_pick_result",data:{hash}}));
        socket.send(JSON.stringify({type:"git_graph",projectId:p.id,data:gitGraphSnapshot(p.id,120)}));
        socket.send(JSON.stringify({type:"git_working_tree",projectId:p.id,data:gitWorkingTree(p.id)}));
      }
      else if(m.action==="git_rollback"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Rollback requires a trusted project.");
        const data=gitIntelligence.rollback(p.path,String(m.commit||""),String(m.mode||"mixed") as any);
        provenanceStore.append(p.id,p.path,{type:"git",actor:"user",action:"rollback",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{commit:String(m.commit||""),mode:String(m.mode||"mixed")}});
        socket.send(JSON.stringify({type:"git_rollback_result",data}));
        socket.send(JSON.stringify({type:"git_graph",projectId:p.id,data:gitGraphSnapshot(p.id,120)}));
        socket.send(JSON.stringify({type:"git_working_tree",projectId:p.id,data:gitWorkingTree(p.id)}));
      }
      else if(m.action==="git_bisect_plan"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_bisect_plan",data:gitIntelligence.bisectPlan(p.path,String(m.good||""),String(m.bad||"HEAD"))}));
      }
      else if(m.action==="git_scoped_diff"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_scoped_diff",data:gitIntelligence.scopedDiff(p.path,String(m.scope||"task") as any,String(m.scope_id||""))}));
      }
      else if(m.action==="git_policy_get"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_policy",data:autoGitPolicy.load(p.path)}));
      }
      else if(m.action==="git_policy_set"){
        const p=officeProject(String(m.project_id||""));
        const policy=autoGitPolicy.save(p.path,{
          autoBranch:Boolean(m.auto_branch),
          autoCommit:Boolean(m.auto_commit),
          branchPrefix:String(m.branch_prefix||"office/"),
          commitPrefix:String(m.commit_prefix||"office:"),
          requireCleanBase:m.require_clean_base!==false
        });
        socket.send(JSON.stringify({type:"git_policy",data:policy}));
      }
      else if(m.action==="git_pr_draft"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"git_pr_draft",data:gitIntelligence.pullRequestDraft(p.path,String(m.target_branch||"main"),String(m.provider||"generic") as any)}));
      }
      else if(m.action==="autonomy_team_create"){
        const p=officeProject(String(m.project_id||""));
        const team=dynamicTeamBuilder.create(p.id,String(m.goal||""));
        socket.send(JSON.stringify({type:"autonomy_team",data:team}));
      }
      else if(m.action==="autonomy_scores"){
        const p=officeProject(String(m.project_id||""));
        const ledger=ledgerStore.load(p.path);
        const current=agentScoring.list(p.path);
        const state=readState(p);
        const rows=(state?.agents||[]).map((a:any)=>agentScoring.score(p.path,ledger,a.id,a.role));
        socket.send(JSON.stringify({type:"autonomy_scores",data:rows.length?rows:current}));
      }
      else if(m.action==="autonomy_route"){
        const p=officeProject(String(m.project_id||""));
        const health=providerEngine.health.checkAll();
        const scores=agentScoring.list(p.path);
        const result=autonomousRouter.choose({
          task:String(m.task||""),
          role:String(m.role||"general"),
          providers:health,
          scores,
          budget:{
            maxCostUsd:m.max_cost_usd===undefined?null:Number(m.max_cost_usd),
            preferredProviders:Array.isArray(m.preferred_providers)?m.preferred_providers.map(String):[],
            avoidProviders:Array.isArray(m.avoid_providers)?m.avoid_providers.map(String):[],
            minTrust:Number(m.min_trust||0)
          }
        });
        socket.send(JSON.stringify({type:"autonomy_route",data:result}));
      }
      else if(m.action==="autonomy_retry_strategy"){
        socket.send(JSON.stringify({type:"autonomy_retry_strategy",data:intelligentRetry.decide({
          attempt:Number(m.attempt||1),
          maxAttempts:Number(m.max_attempts||3),
          repeatedErrors:Number(m.repeated_errors||0),
          noProgressCount:Number(m.no_progress_count||0),
          currentProvider:String(m.current_provider||""),
          fallbackProviders:Array.isArray(m.fallback_providers)?m.fallback_providers.map(String):[],
          costExceeded:Boolean(m.cost_exceeded),
          destructiveRisk:Boolean(m.destructive_risk)
        })}));
      }
      else if(m.action==="autonomy_recovery"){
        socket.send(JSON.stringify({type:"autonomy_recovery",data:noProgressRecovery.decide({
          noProgressCount:Number(m.no_progress_count||0),
          repeatedCommandCount:Number(m.repeated_command_count||0),
          repeatedErrorCount:Number(m.repeated_error_count||0),
          costExceeded:Boolean(m.cost_exceeded),
          runtimeExceeded:Boolean(m.runtime_exceeded),
          fallbackProvider:m.fallback_provider?String(m.fallback_provider):null
        })}));
      }
      else if(m.action==="safety_v2_snapshot"){socket.send(JSON.stringify({type:"safety_v2_snapshot",projectId:String(m.project_id||""),data:safetyV2Snapshot(String(m.project_id||""))}));}
      else if(m.action==="safety_classify_command"){socket.send(JSON.stringify({type:"safety_command_risk",data:commandClassifier.classify(String(m.command||""))}));}
      else if(m.action==="safety_authorize"){
        const p=officeProject(String(m.project_id||""));
        const result=authorizationService.authorize({projectId:p.id,projectPath:p.path,actor:String(m.actor||"user"),action:String(m.permission_action||"providerExecution") as any,policy:{network:String(m.network||"ask") as any,providerExecution:String(m.provider_execution||"allow") as any,terminalWrite:String(m.terminal_write||"ask") as any,terminalTerminate:String(m.terminal_terminate||"ask") as any,filesystemWrite:String(m.filesystem_write||"ask") as any},profile:getSandboxProfile(String(m.profile_id||"guarded")),resource:m.resource?String(m.resource):null,command:m.command?String(m.command):null,approvalId:m.approval_id?String(m.approval_id):null});
        socket.send(JSON.stringify({type:"safety_authorization_result",data:result}));broadcast({type:"safety_v2_snapshot",projectId:p.id,data:safetyV2Snapshot(p.id)});
      }
      else if(m.action==="safety_approval_decide"){
        const p=officeProject(String(m.project_id||""));const row=approvalStore.decide(p.path,String(m.approval_id||""),String(m.decision||"rejected")==="approved"?"approved":"rejected",String(m.actor||"user"));socket.send(JSON.stringify({type:"safety_approval_result",data:row}));broadcast({type:"safety_v2_snapshot",projectId:p.id,data:safetyV2Snapshot(p.id)});
      }
      else if(m.action==="safety_budget_check"){socket.send(JSON.stringify({type:"safety_budget_result",data:runtimeBudgetGuard.evaluate({startedAt:String(m.started_at||new Date().toISOString()),tokens:Number(m.tokens||0),costUsd:Number(m.cost_usd||0),ceilings:{maxRuntimeMinutes:Number(m.max_runtime_minutes||90),maxTokens:Number(m.max_tokens||250000),maxCostUsd:Number(m.max_cost_usd||25)}})}));}
      else if(m.action==="safety_mask_secrets"){socket.send(JSON.stringify({type:"safety_masked_text",data:{text:maskSecrets(String(m.text||""))}}));}
      else if(m.action==="memory_v2_snapshot"){
        socket.send(JSON.stringify({type:"memory_v2_snapshot",projectId:String(m.project_id||""),data:memoryV2Snapshot(String(m.project_id||""))}));
      }
      else if(m.action==="memory_v2_add"){
        const p=officeProject(String(m.project_id||""));
        const record=await memoryV2.add(p.id,p.path,{
          category:String(m.category||"fact") as any,
          scope:String(m.scope||"shared") as any,
          agentId:m.agent_id?String(m.agent_id):null,
          taskId:m.task_id?String(m.task_id):null,
          title:String(m.title||"Memory"),
          body:String(m.body||""),
          tags:Array.isArray(m.tags)?m.tags.map(String):[],
          importance:Number(m.importance??0.6),
          confidence:Number(m.confidence??0.7),
          provenance:{sourceType:String(m.source_type||"user") as any,sourceId:m.source_id?String(m.source_id):null,actor:m.actor?String(m.actor):null}
        });
        socket.send(JSON.stringify({type:"memory_v2_added",data:record}));
        broadcast({type:"memory_v2_snapshot",projectId:p.id,data:memoryV2Snapshot(p.id)});
      }
      else if(m.action==="memory_v2_search"){
        const p=officeProject(String(m.project_id||""));
        const hits=await memoryV2.search(p.path,{query:String(m.query||""),agentId:m.agent_id?String(m.agent_id):null,taskId:m.task_id?String(m.task_id):null,categories:Array.isArray(m.categories)?m.categories.map(String) as any:undefined,limit:Number(m.limit||10)});
        socket.send(JSON.stringify({type:"memory_v2_search_result",data:hits}));
      }
      else if(m.action==="memory_v2_prune"){
        const p=officeProject(String(m.project_id||""));
        const data=memoryV2.prune(p.path);
        socket.send(JSON.stringify({type:"memory_v2_prune_result",data}));
        broadcast({type:"memory_v2_snapshot",projectId:p.id,data:memoryV2Snapshot(p.id)});
      }
      else if(m.action==="memory_v2_specialties"){
        const p=officeProject(String(m.project_id||""));
        const data=inferSpecialties(memoryV2.store.list(p.path),String(m.agent_id||""));
        socket.send(JSON.stringify({type:"memory_v2_specialties",data}));
      }
      else if(m.action==="integration_v2_snapshot"){
        socket.send(JSON.stringify({type:"integration_v2_snapshot",projectId:String(m.project_id||""),data:integrationV2Snapshot(String(m.project_id||""))}));
      }
      else if(m.action==="integration_v2_execute"){
        const p=officeProject(String(m.project_id||""));
        const cfg=integrationRegistry.load(p.path).find(x=>x.id===String(m.integration_id||""));
        if(!cfg)throw new Error("Integration is not configured.");
        if(!cfg.enabled)throw new Error("Integration is disabled.");
        const token=cfg.tokenEnv?process.env[cfg.tokenEnv]||null:null;
        const result=await integrationActionRouter.execute(p.path,{
          integrationId:String(m.integration_id||""),
          action:String(m.integration_action||""),
          projectId:p.id,
          actor:String(m.actor||"user"),
          payload:m.payload&&typeof m.payload==="object"?m.payload:{},
          idempotencyKey:m.idempotency_key?String(m.idempotency_key):null
        },token);
        socket.send(JSON.stringify({type:"integration_v2_result",data:result}));
        broadcast({type:"integration_v2_snapshot",projectId:p.id,data:integrationV2Snapshot(p.id)});
      }
      else if(m.action==="integration_watch_add"){
        const p=officeProject(String(m.project_id||""));
        const watch=integrationWatchStore.add(p.id,p.path,{
          integrationId:String(m.integration_id||"ci"),
          kind:String(m.kind||"ci-status") as any,
          resource:String(m.resource||""),
          intervalMinutes:Number(m.interval_minutes||15)
        });
        socket.send(JSON.stringify({type:"integration_watch_added",data:watch}));
        broadcast({type:"integration_v2_snapshot",projectId:p.id,data:integrationV2Snapshot(p.id)});
      }
      else if(m.action==="integration_watch_remove"){
        const p=officeProject(String(m.project_id||""));
        const ok=integrationWatchStore.remove(p.path,String(m.watch_id||""));
        socket.send(JSON.stringify({type:"integration_watch_removed",data:{ok}}));
        broadcast({type:"integration_v2_snapshot",projectId:p.id,data:integrationV2Snapshot(p.id)});
      }
      else if(m.action==="integration_watch_check"){
        const p=officeProject(String(m.project_id||""));
        const watch=integrationWatchStore.list(p.path).find(x=>x.id===String(m.watch_id||""));
        if(!watch)throw new Error("Integration watch not found.");
        let state="unsupported";
        if(watch.kind==="ci-status"){
          const cfg=integrationRegistry.load(p.path).find(x=>x.id===watch.integrationId);
          const token=cfg?.tokenEnv?process.env[cfg.tokenEnv]||null:null;
          const result=await integrationActionRouter.execute(p.path,{
            integrationId:"ci",action:"get_status",projectId:p.id,actor:"watch",
            payload:{url:watch.resource},idempotencyKey:`watch:${watch.id}`
          },token);
          state=result.ok?JSON.stringify(result.data).slice(0,500):`error:${result.message}`;
        }
        integrationWatchStore.updateState(p.path,watch.id,state);
        socket.send(JSON.stringify({type:"integration_watch_result",data:{watchId:watch.id,state}}));
        broadcast({type:"integration_v2_snapshot",projectId:p.id,data:integrationV2Snapshot(p.id)});
      }
      else if(m.action==="distributed_snapshot"){
        socket.send(JSON.stringify({type:"distributed_snapshot",projectId:String(m.project_id||""),data:distributedSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="distributed_job_create"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Distributed job creation requires a trusted project.");
        const job=distributedManager.jobs.create(p.id,p.path,{
          command:String(m.command||""),
          cwd:m.cwd?String(m.cwd):null,
          requiredTags:Array.isArray(m.required_tags)?m.required_tags.map(String):[],
          maxAttempts:Number(m.max_attempts||3)
        });
        socket.send(JSON.stringify({type:"distributed_job_created",data:job}));
        broadcast({type:"distributed_snapshot",projectId:p.id,data:distributedSnapshot(p.id)});
      }
      else if(m.action==="distributed_run_next"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Distributed execution requires a trusted project.");
        const result=await distributedManager.runNext(p.path,workerRegistry.list(p.path),event=>{
          broadcast({type:event.type==="job.output"?"distributed_job_output":"distributed_job_state",projectId:p.id,jobId:event.jobId,data:event.data});
        });
        socket.send(JSON.stringify({type:"distributed_run_result",data:result}));
        broadcast({type:"distributed_snapshot",projectId:p.id,data:distributedSnapshot(p.id)});
      }
      else if(m.action==="distributed_recover"){
        const p=officeProject(String(m.project_id||""));
        const result=distributedManager.recover(p.path);
        socket.send(JSON.stringify({type:"distributed_recovery_result",data:result}));
        broadcast({type:"distributed_snapshot",projectId:p.id,data:distributedSnapshot(p.id)});
      }
      else if(m.action==="distributed_job_log"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"distributed_job_log",data:{jobId:String(m.job_id||""),text:distributedLogs.read(p.path,String(m.job_id||""))}}));
      }
      else if(m.action==="distributed_artifact_pull"){
        const p=officeProject(String(m.project_id||""));
        if(!p.runnerTrusted)throw new Error("Artifact transfer requires a trusted project.");
        const worker=workerRegistry.list(p.path).find(x=>x.id===String(m.worker_id||""));
        if(!worker)throw new Error("Worker not found.");
        const localRoot=path.join(p.path,".ai-kit","workers","artifacts",String(m.job_id||"manual"));
        const localPath=path.join(localRoot,path.basename(String(m.remote_path||"artifact.bin")));
        const result=artifactTransfer.pull(worker,String(m.remote_path||""),localPath);
        const jobId=m.job_id?String(m.job_id):null;
        if(jobId&&result.ok){
          const job=distributedManager.jobs.list(p.path).find(x=>x.id===jobId);
          if(job)distributedManager.jobs.update(p.path,jobId,{artifactPaths:[...job.artifactPaths,localPath]});
        }
        socket.send(JSON.stringify({type:"distributed_artifact_result",data:result}));
        broadcast({type:"distributed_snapshot",projectId:p.id,data:distributedSnapshot(p.id)});
      }
      else if(m.action==="installer_snapshot"){
        socket.send(JSON.stringify({type:"installer_snapshot",data:installerSnapshot()}));
      }
      else if(m.action==="provider_install_launch"){
        socket.send(JSON.stringify({type:"provider_install_result",data:providerInstallerV2.launch(String(m.provider_id||""))}));
      }
      else if(m.action==="first_run_diagnostics"){
        socket.send(JSON.stringify({type:"first_run_diagnostics",data:firstRunDiagnostics.run(process.cwd())}));
      }
      else if(m.action==="update_stage"){
        const stage=updaterV2.stage(String(m.source_path||""),String(m.version||""));
        socket.send(JSON.stringify({type:"update_stage_result",data:stage}));
      }
      else if(m.action==="update_verify"){
        const stage={
          id:String(m.stage?.id||""),version:String(m.stage?.version||""),sourcePath:String(m.stage?.sourcePath||""),
          stagedPath:String(m.stage?.stagedPath||""),manifestPath:String(m.stage?.manifestPath||""),sha256:String(m.stage?.sha256||""),
          createdAt:String(m.stage?.createdAt||new Date().toISOString()),verified:Boolean(m.stage?.verified)
        };
        socket.send(JSON.stringify({type:"update_verify_result",data:updaterV2.verify(stage)}));
      }
      else if(m.action==="update_apply"){
        if(!Boolean(m.confirmed))throw new Error("Update apply requires explicit confirmation.");
        const stage={
          id:String(m.stage?.id||""),version:String(m.stage?.version||""),sourcePath:String(m.stage?.sourcePath||""),
          stagedPath:String(m.stage?.stagedPath||""),manifestPath:String(m.stage?.manifestPath||""),sha256:String(m.stage?.sha256||""),
          createdAt:String(m.stage?.createdAt||new Date().toISOString()),verified:Boolean(m.stage?.verified)
        };
        socket.send(JSON.stringify({type:"update_apply_result",data:updaterV2.applyVerified(stage,process.cwd())}));
      }
      else if(m.action==="update_rollback"){
        if(!Boolean(m.confirmed))throw new Error("Rollback requires explicit confirmation.");
        socket.send(JSON.stringify({type:"update_rollback_result",data:updaterV2.rollback(String(m.rollback_path||""),process.cwd())}));
      }
      else if(m.action==="plugin_v2_snapshot"){
        socket.send(JSON.stringify({type:"plugin_v2_snapshot",projectId:String(m.project_id||""),data:pluginV2Snapshot(String(m.project_id||""))}));
      }
      else if(m.action==="plugin_v2_enable"){
        const p=officeProject(String(m.project_id||""));
        const state=pluginManagerV2.setEnabled(p.path,String(m.plugin_id||""),Boolean(m.enabled));
        socket.send(JSON.stringify({type:"plugin_v2_state",data:state}));
        broadcast({type:"plugin_v2_snapshot",projectId:p.id,data:pluginV2Snapshot(p.id)});
      }
      else if(m.action==="plugin_v2_invoke"){
        const p=officeProject(String(m.project_id||""));
        const results=await pluginManagerV2.invoke(p.path,{
          projectId:p.id,projectPath:p.path,actor:String(m.actor||"user"),
          hook:String(m.hook||"tool.invoke") as any,
          payload:m.payload&&typeof m.payload==="object"?m.payload:{}
        });
        socket.send(JSON.stringify({type:"plugin_v2_result",data:results}));
        broadcast({type:"plugin_v2_snapshot",projectId:p.id,data:pluginV2Snapshot(p.id)});
      }
      else if(m.action==="governance_snapshot"){
        socket.send(JSON.stringify({type:"governance_snapshot",projectId:String(m.project_id||""),data:governanceSnapshot(String(m.project_id||""))}));
      }
      else if(m.action==="governance_member_upsert"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.upsertMember(p.path,{id:String(m.member_id||""),displayName:String(m.display_name||m.member_id||""),role:String(m.role||"operator") as any,active:m.active!==false});
        governanceAudit.append(p.path,String(m.actor||"user"),"member.upsert",{memberId:row.id,role:row.role});
        socket.send(JSON.stringify({type:"governance_member_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_decision_create"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.createDecision(p.id,p.path,{title:String(m.title||""),rationale:String(m.rationale||""),proposedBy:String(m.actor||"user"),supersedes:m.supersedes?String(m.supersedes):null,evidenceIds:Array.isArray(m.evidence_ids)?m.evidence_ids.map(String):[]});
        governanceAudit.append(p.path,String(m.actor||"user"),"decision.create",{decisionId:row.id,title:row.title});
        socket.send(JSON.stringify({type:"governance_decision_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_decision_decide"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.decideDecision(p.path,String(m.decision_id||""),String(m.member_id||"user"),Boolean(m.approve));
        governanceAudit.append(p.path,String(m.member_id||"user"),m.approve?"decision.approve":"decision.reject",{decisionId:row.id});
        socket.send(JSON.stringify({type:"governance_decision_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_waiver_create"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.createWaiver(p.id,p.path,{policyKey:String(m.policy_key||""),reason:String(m.reason||""),severity:String(m.severity||"medium") as any,requestedBy:String(m.actor||"user"),expiresAt:m.expires_at?String(m.expires_at):null});
        governanceAudit.append(p.path,String(m.actor||"user"),"waiver.create",{waiverId:row.id,policyKey:row.policyKey,severity:row.severity});
        socket.send(JSON.stringify({type:"governance_waiver_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_waiver_approve"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.approveWaiver(p.path,String(m.waiver_id||""),String(m.member_id||"user"));
        governanceAudit.append(p.path,String(m.member_id||"user"),"waiver.approve",{waiverId:row.id});
        socket.send(JSON.stringify({type:"governance_waiver_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_evidence_add"){
        const p=officeProject(String(m.project_id||""));
        const row=governanceStore.addEvidence(p.id,p.path,{type:String(m.evidence_type||"manual") as any,label:String(m.label||""),status:String(m.status||"unknown") as any,source:String(m.source||""),sha256:m.sha256?String(m.sha256):null,metadata:m.metadata&&typeof m.metadata==="object"?m.metadata:{}});
        governanceAudit.append(p.path,String(m.actor||"user"),"evidence.add",{evidenceId:row.id,type:row.type,status:row.status});
        socket.send(JSON.stringify({type:"governance_evidence_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_signoff_create"){
        const p=officeProject(String(m.project_id||""));
        const stableUnlocked=stableAcceptanceBinder.isUnlocked(p.path);
        const evaluation=releaseGovernance.evaluate(p.id,p.path,stableUnlocked);
        const row=governanceStore.createSignoff(p.id,p.path,{version:String(m.version||""),requestedBy:String(m.actor||"user"),requiredApprovals:evaluation.requiredReleaseApprovals,evidenceIds:stableAcceptanceBinder.evidenceIds(p.id,p.path),blockers:evaluation.blockers});
        governanceAudit.append(p.path,String(m.actor||"user"),"release.signoff.create",{signoffId:row.id,version:row.version,blockers:row.blockers});
        socket.send(JSON.stringify({type:"governance_signoff_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_signoff_approve"){
        const p=officeProject(String(m.project_id||""));
        const policy=governanceStore.policy(p.id,p.path);
        const member=governanceStore.members(p.path).find(x=>x.id===String(m.member_id||""));
        if(!member||!member.active)throw new Error("Active governance member not found.");
        governanceAuth.assert(policy,member.role,"release");
        const row=governanceStore.approveSignoff(p.path,String(m.signoff_id||""),member.id);
        governanceAudit.append(p.path,member.id,"release.signoff.approve",{signoffId:row.id,status:row.status});
        socket.send(JSON.stringify({type:"governance_signoff_result",data:row}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="governance_audit_verify"){
        const p=officeProject(String(m.project_id||""));
        socket.send(JSON.stringify({type:"governance_audit_result",data:governanceAudit.verify(p.path)}));
      }
      else if(m.action==="governance_prune"){
        const p=officeProject(String(m.project_id||""));
        const data=governanceStore.prune(p.id,p.path);
        governanceAudit.append(p.path,String(m.actor||"user"),"governance.prune",data);
        socket.send(JSON.stringify({type:"governance_prune_result",data}));
        broadcast({type:"governance_snapshot",projectId:p.id,data:governanceSnapshot(p.id)});
      }
      else if(m.action==="retry_command")retryCommand(String(m.command_id||""));
      else if(m.action==="set_scheduled_audit")setScheduledAudit(
        String(m.project_id||""),String(m.id||""),String(m.label||""),String(m.command||"status"),
        String(m.cadence||"off") as "off"|"daily"|"weekly",!!m.enabled
      );
      else if(m.action==="set_office_theme"){
        const allowed=["classic-cc0","pixel-office-32","luxury-office","modern-corporate","call-center","top-down-corporate","office-hell"];
        const theme=String(m.theme||"classic-cc0");
        if(!allowed.includes(theme))throw new Error("Unknown Office theme.");
        settings.officeTheme=theme as OfficeThemeId;saveJson(settingsFile,settings);pushMissionSettings();
      }
      else if(m.action==="get_task_report"){
        const report=readTaskReport(String(m.command_id||""));
        if(report)socket.send(JSON.stringify({type:"task_report",data:report}));
      }
      else if(m.action==="rename_agent"){
        const projectId=String(m.project_id||""),id=String(m.agent_id||""),name=String(m.name||"").trim();
        if(projectId&&id&&name){
          settings.agentNamesByProject=settings.agentNamesByProject||{};
          settings.agentNamesByProject[projectId]=settings.agentNamesByProject[projectId]||{};
          settings.agentNamesByProject[projectId][id]=name;
          saveJson(settingsFile,settings);pushNames();
          const project=projects.find(p=>p.id===projectId);if(project)pushState(project);
        }
      }
    }catch(e){socket.send(JSON.stringify({type:"error",message:e instanceof Error?e.message:"Unknown bridge error"}));}
  });
});

refreshWatchers();
setInterval(()=>{for(const p of projects.filter(x=>x.enabled))pumpEvents(p);pushRunner();processQueue();},1500);
setInterval(()=>{runDueAudits();},60000);

const boot=runnerStatus();
console.log(`AI Development Office bridge listening on ws://localhost:${port}`);
console.log(`Persistent data: ${dataRoot}`);
console.log(`Cursor: ${boot.providers.cursor.available?"ONLINE":"OFFLINE"} ${boot.providers.cursor.executable||""}`);
console.log(`Claude: ${boot.providers.claude.available?"ONLINE":"OFFLINE"} ${boot.providers.claude.executable||""}`);
console.log(`Projects: ${projects.length}`);
for(const p of projects)console.log(` - ${p.name}: ${p.path} [${p.provider||"auto"}]`);
