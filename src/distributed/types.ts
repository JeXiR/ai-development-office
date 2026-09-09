export type DistributedJobStatus="queued"|"running"|"completed"|"failed"|"cancelled"|"retrying";

export type DistributedJob={
  id:string;
  projectId:string;
  workerId:string|null;
  command:string;
  cwd:string|null;
  requiredTags:string[];
  status:DistributedJobStatus;
  attempt:number;
  maxAttempts:number;
  createdAt:string;
  startedAt:string|null;
  finishedAt:string|null;
  exitCode:number|null;
  error:string|null;
  logFile:string|null;
  artifactPaths:string[];
};

export type WorkerCapability={
  workerId:string;
  kind:"local"|"ssh"|"docker";
  tags:string[];
  maxConcurrent:number;
  activeJobs:number;
  online:boolean;
  score:number;
};

export type ArtifactTransferResult={
  ok:boolean;
  source:string;
  destination:string;
  bytes:number;
  message:string;
};
