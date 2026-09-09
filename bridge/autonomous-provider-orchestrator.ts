import crypto from "node:crypto";
import {createKitEngine} from "./kit-engine-runtime";
import {routeWithPolicy,providerAssignmentSnapshot} from "./provider-policy-runtime";
import {classifyMissionRequirements,requirementKeys} from "../src/orchestration/mission-classifier";
import {selectAgentsForCapabilities} from "../src/orchestration/agent-selector";
import {preferredUniversalProvider} from "../src/provider-sdk/eligibility";
import type {AutonomousMissionPlan} from "../src/orchestration/types";

export async function planAutonomousProviderMission(data:any){
  const projectId=String(data?.projectId||data?.project_id||"");
  const projectPath=String(data?.projectPath||data?.project_path||"");
  const goal=String(data?.goal||"").trim();
  const agents=Array.isArray(data?.agents)?data.agents:[];
  if(!projectId||!projectPath||!goal)throw new Error("projectId, projectPath and goal are required.");

  const kit=createKitEngine();
  const kitCapabilities=await kit.resolveCapabilities(projectPath);
  const requirements=classifyMissionRequirements(goal);
  const selected=selectAgentsForCapabilities(agents,kitCapabilities);
  const assignmentState=providerAssignmentSnapshot();
  const preferredProvider=preferredUniversalProvider(
    data?.preferredProvider||data?.provider||data?.projectProvider
  );

  const assignments=[];
  for(const agent of selected){
    const route=await routeWithPolicy({
      agentId:agent.id,
      requires:requirementKeys(requirements),
      preferredProvider
    });
    const pin=assignmentState.pins.find((x:any)=>x.agentId===agent.id)||null;
    assignments.push({
      agentId:agent.id,
      role:agent.role||agent.name||agent.id,
      capabilityIds:kitCapabilities,
      providerId:route.providerId,
      model:pin?.model||null,
      routeEvidenceId:route.evidenceId||null,
      routeReasons:route.reasons||[]
    });
  }

  const plan:AutonomousMissionPlan={
    missionId:crypto.randomUUID(),
    projectId,
    projectPath,
    goal,
    kitCapabilities,
    requirements,
    assignments,
    createdAt:new Date().toISOString()
  };
  return plan;
}
