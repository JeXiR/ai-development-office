export type WorkerKind="local"|"ssh"|"docker";
export type WorkerStatus="unknown"|"online"|"offline"|"busy";

export type WorkerConfig={
  id:string;
  name:string;
  kind:WorkerKind;
  enabled:boolean;
  host:string|null;
  user:string|null;
  port:number|null;
  container:string|null;
  workdir:string|null;
  tags:string[];
  maxConcurrent:number;
};

export type WorkerRuntimeState={
  config:WorkerConfig;
  status:WorkerStatus;
  activeJobs:number;
  lastCheckAt:string|null;
  message:string;
};
