export type SessionReplayEvent={
  id:string;
  sessionId:string;
  projectId:string;
  agentId:string;
  type:string;
  timestamp:string;
  payload:Record<string,unknown>;
};

export type SessionReplay={
  sessionId:string;
  projectId:string;
  events:SessionReplayEvent[];
};
