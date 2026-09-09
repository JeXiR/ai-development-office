export type SafetyAction="warn"|"constrain"|"pause"|"stop";
export type SafetyReason=
  |"repeated-error"
  |"repeated-command"
  |"no-progress"
  |"time-ceiling"
  |"token-ceiling"
  |"cost-ceiling"
  |"protected-path"
  |"manual";

export type SafetyPolicy={
  repeatedErrorThreshold:number;
  repeatedCommandThreshold:number;
  noProgressThreshold:number;
  maxRuntimeMinutes:number;
  maxTokens:number;
  maxCostUsd:number;
  protectedPaths:string[];
};

export type SafetyIncident={
  id:string;
  projectId:string;
  sessionId:string;
  agentId:string;
  reason:SafetyReason;
  action:SafetyAction;
  message:string;
  createdAt:string;
  metadata:Record<string,unknown>;
};

export type SafetySessionState={
  sessionId:string;
  projectId:string;
  agentId:string;
  paused:boolean;
  constrained:boolean;
  stopped:boolean;
  lastCommands:string[];
  lastErrors:string[];
  lastProgressSignatures:string[];
  startedAt:string;
  tokens:number;
  costUsd:number;
};
