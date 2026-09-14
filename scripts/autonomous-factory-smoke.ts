import {applyFactoryBudget,completeFactoryIfIdle,emptyFactoryState,isRetryableFactoryFailure,pickNextFactoryItems,pruneFactoryQueue,recordFactoryResult,recoverTrippedFactoryAfterSuccess,shouldApplySessionBudget,type FactoryState} from "../src/factory/autonomous-factory";
import {DEFAULT_AGENT_BUDGET,evaluateAgentBudget} from "../src/factory/agent-budget";
import {buildCliLaunch} from "../src/providers/cli-launch";

const items=[
  {id:"PROG-1",title:"Auth form",source:"progress",sourceFile:"PROGRESS.md",status:"todo",assignedRole:"Frontend"},
  {id:"COV-1",title:"devops: CI",source:"coverage",sourceFile:".ai-kit/project-coverage.json",status:"todo"},
  {id:"ROAD-1",title:"Later roadmap",source:"roadmap",sourceFile:"docs/ROADMAP.md",status:"todo"},
  {id:"PROG-2",title:"Billing",source:"progress",sourceFile:"PROGRESS.md",status:"done"}
];

const next=pickNextFactoryItems(items, [{workItemId:"PROG-9",status:"queued"}], 4);
if(next.map(x=>x.id).join(",")!=="PROG-1,ROAD-1")throw new Error("factory should pick progress then roadmap and ignore coverage");

const claimed=pickNextFactoryItems(items, [{workItemId:"PROG-1",status:"running"}], 4);
if(claimed.map(x=>x.id).join(",")!=="ROAD-1")throw new Error("running progress item should leave roadmap only");

const skipped=pickNextFactoryItems(items, [], 4, ["PROG-1"]);
if(skipped.map(x=>x.id).join(",")!=="ROAD-1")throw new Error("failed progress item should not be re-picked in the same factory run");

const coverageOnly=emptyFactoryState("p1");
coverageOnly.status="running";
completeFactoryIfIdle(coverageOnly,[{id:"COV-1",title:"docs: Feature contracts",source:"coverage",status:"todo"}],[]);
if(coverageOnly.status!=="completed")throw new Error("coverage-only leftovers must not keep the factory running");

const state:FactoryState=emptyFactoryState("p1");
state.status="running";
recordFactoryResult(state,"PROG-1",true,"done");
completeFactoryIfIdle(state, items.filter(x=>x.id!=="PROG-1"), []);
if(state.status==="completed")throw new Error("roadmap remaining should keep factory running");
recordFactoryResult(state,"ROAD-1",true,"done");
completeFactoryIfIdle(state, [], []);
if(state.status!=="completed")throw new Error("factory did not complete when canonical work was empty");

const skippedOpen=emptyFactoryState("p2");
skippedOpen.status="running";
recordFactoryResult(skippedOpen,"ROAD-01-sites-sitemap-domain",false,"no winner");
completeFactoryIfIdle(skippedOpen,[{id:"ROAD-01-sites-sitemap-domain",title:"Sites",source:"roadmap",status:"todo"}],[]);
if(skippedOpen.status==="completed")throw new Error("failed open roadmap item must not mark factory complete");

const budget=evaluateAgentBudget({
  agentId:"frontend",
  tokens:DEFAULT_AGENT_BUDGET.maxTokens,
  costUsd:0,
  runtimeMinutes:1,
  consecutiveFailures:0
});
if(budget.ok||budget.action!=="stop")throw new Error("token ceiling should stop the agent");

const trip:FactoryState=emptyFactoryState("p1");
trip.status="running";
const decision=applyFactoryBudget(trip,{agentId:"frontend",tokens:1,costUsd:1,runtimeMinutes:1},{maxConsecutiveFailures:1});
if(decision.ok) {
  recordFactoryResult(trip,"PROG-x",false,"failed");
  applyFactoryBudget(trip,{agentId:"frontend",tokens:1,costUsd:1,runtimeMinutes:1},{maxConsecutiveFailures:1});
}
if(trip.status!=="tripped")throw new Error("failure circuit breaker did not trip");

const custom=buildCliLaunch({
  provider:"custom",
  executable:"my-agent",
  projectPath:"D:/proj",
  prompt:"do the work",
  mutating:true,
  customArgs:["--cwd","{project}","--ask","{prompt}"]
});
const longSession=emptyFactoryState("p1");
longSession.status="running";
longSession.startedAt=new Date(Date.now()-20*60000).toISOString();
const keepGoing=applyFactoryBudget(longSession,{agentId:"architect",tokens:10,costUsd:0.1,runtimeMinutes:120},{maxRuntimeMinutes:1440});
if(!keepGoing.ok)throw new Error("factory session under the 24h ceiling must not trip after a long command");

const retryable=emptyFactoryState("p3");
retryable.status="running";
recordFactoryResult(retryable,"ROAD-14",false,"Independent verifier timed out.",{verifierStatus:"error"});
if(retryable.failedIds.includes("ROAD-14"))throw new Error("timeout must stay retryable");
if(retryable.consecutiveFailures!==0)throw new Error("timeout must not count as a consecutive factory failure");
if(!isRetryableFactoryFailure("Did not ship product files for phase 14. Planning-only closeout is not completion."))throw new Error("planning-only must be retryable");
const again=pickNextFactoryItems([{id:"ROAD-14",title:"Phase 14",source:"roadmap",status:"todo"}],[],1,retryable.failedIds);
if(again[0]?.id!=="ROAD-14")throw new Error("timeout item must stay pickable");

if(custom.args.join(" ")!=="--cwd D:/proj --ask do the work")throw new Error("custom command template failed");

const copilot=buildCliLaunch({provider:"copilot",executable:"copilot",projectPath:"D:/proj",prompt:"fix it",mutating:false});
if(copilot.args[0]!=="-p")throw new Error("copilot adapter missing");

const stale=emptyFactoryState("indexguard");
stale.status="tripped";
stale.tripReason="Per-agent circuit breaker tripped for architect: runtime.";
stale.queuedIds=["ROAD-01-phase-15-deployment-intelligence","ROAD-01-phase-24-portfolio-geo-ux"];
stale.failedIds=["ROAD-01-phase-15-deployment-intelligence"];
stale.completedIds=[];
if(shouldApplySessionBudget(stale))throw new Error("tripped factory must not keep applying session budget");
recordFactoryResult(stale,"ROAD-01-phase-24-portfolio-geo-ux",true,"Phase 24 shipped");
if(stale.status!=="idle")throw new Error("runtime trip must idle after a later queued success");
if(stale.tripReason)throw new Error("runtime trip reason must clear after recovery");
if(stale.queuedIds.includes("ROAD-01-phase-24-portfolio-geo-ux"))throw new Error("completed item must leave queuedIds");
if(!stale.completedIds.includes("ROAD-01-phase-24-portfolio-geo-ux"))throw new Error("success must record completedIds");
pruneFactoryQueue(stale);
if(stale.queuedIds.includes("ROAD-01-phase-15-deployment-intelligence"))throw new Error("failed ids must be pruned from queuedIds");

const failTrip=emptyFactoryState("p4");
failTrip.status="tripped";
failTrip.tripReason="Per-agent circuit breaker tripped for architect: failures.";
failTrip.consecutiveFailures=8;
recordFactoryResult(failTrip,"ROAD-x",true,"recovered one item");
if(failTrip.status!=="idle" && failTrip.status!=="tripped")throw new Error("unexpected status");
if(failTrip.status!=="tripped")throw new Error("failure trips must not auto-idle on a single success");
recoverTrippedFactoryAfterSuccess(failTrip);
if(failTrip.status!=="tripped")throw new Error("failure trips stay tripped until a human restart");

console.log("Autonomous factory smoke PASS");
