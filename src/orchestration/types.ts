import type {UniversalProviderId} from "../provider-sdk/types";

export type MissionProviderRequirement={
  coding?:boolean;
  reasoning?:boolean;
  toolCalling?:boolean;
  structuredOutput?:boolean;
  vision?:boolean;
  localPreferred?:boolean;
};

export type AutonomousAgentAssignment={
  agentId:string;
  role:string;
  capabilityIds:string[];
  providerId:UniversalProviderId|null;
  model:string|null;
  routeEvidenceId:string|null;
  routeReasons:string[];
};

export type AutonomousMissionPlan={
  missionId:string;
  projectId:string;
  projectPath:string;
  goal:string;
  kitCapabilities:string[];
  requirements:MissionProviderRequirement;
  assignments:AutonomousAgentAssignment[];
  createdAt:string;
};
