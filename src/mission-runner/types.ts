export type MissionRunnerPhase=
  |"idle"
  |"planning"
  |"approval"
  |"running"
  |"testing"
  |"reviewing"
  |"completed"
  |"failed"
  |"cancelled";

export type MissionRunnerEvent={
  missionId:string|null;
  phase:MissionRunnerPhase;
  message:string;
  at:string;
  agentId?:string;
  providerId?:string|null;
  data?:unknown;
};

export type MissionRunnerResult={
  missionId:string;
  status:string;
  finalResult:unknown;
  errors:string[];
  agentResults:unknown[];
};
