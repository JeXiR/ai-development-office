export type MissionExecutionStatus=
  |"queued"|"planning"|"running"|"retrying"|"testing"|"reviewing"|"completed"|"failed"|"cancelled";

export type MissionExecutionEvent={
  missionId:string;
  type:string;
  at:string;
  agentId?:string;
  providerId?:string|null;
  message?:string;
  data?:unknown;
};

export type MissionExecutionSummary={
  missionId:string;
  status:MissionExecutionStatus;
  startedAt:string;
  completedAt:string|null;
  agentResults:Array<{
    agentId:string;
    providerId:string|null;
    ok:boolean;
    output:unknown;
    error:string|null;
    attempts:number;
  }>;
  finalResult:unknown;
  errors:string[];
};
