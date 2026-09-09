export type RuntimeProvider="cursor"|"claude"|"codex"|"gemini"|"opencode"|"local";

export type RuntimeSessionStatus=
  |"starting"
  |"running"
  |"stopping"
  |"exited"
  |"failed";

export type RuntimeSessionSnapshot={
  id:string;
  projectId:string;
  projectPath:string;
  agentId:string;
  role:string;
  provider:RuntimeProvider;
  status:RuntimeSessionStatus;
  pid:number|null;
  cols:number;
  rows:number;
  createdAt:string;
  startedAt:string|null;
  exitedAt:string|null;
  exitCode:number|null;
  lastActivityAt:string;
  command:string;
};

export type RuntimeEventType=
  |"runtime.session.starting"
  |"runtime.session.started"
  |"runtime.session.output"
  |"runtime.session.input"
  |"runtime.session.resized"
  |"runtime.session.stopping"
  |"runtime.session.exited"
  |"runtime.session.failed";

export type RuntimeEvent={
  id:string;
  type:RuntimeEventType;
  timestamp:string;
  sessionId:string;
  projectId:string;
  agentId:string;
  role:string;
  provider:RuntimeProvider;
  payload:Record<string,unknown>;
};

export type SpawnRuntimeSessionInput={
  projectId:string;
  projectPath:string;
  agentId:string;
  role:string;
  provider:RuntimeProvider;
  executable:string;
  args?:string[];
  cwd?:string;
  env?:Record<string,string>;
  cols?:number;
  rows?:number;
};
