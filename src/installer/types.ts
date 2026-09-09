export type PrerequisiteStatus="detected"|"missing"|"unknown";

export type PrerequisiteCheck={
  id:string;
  label:string;
  command:string;
  args:string[];
  status:PrerequisiteStatus;
  version:string|null;
  installHint:string|null;
};

export type UpdateStage={
  id:string;
  version:string;
  sourcePath:string;
  stagedPath:string;
  manifestPath:string;
  sha256:string;
  createdAt:string;
  verified:boolean;
};

export type DesktopRuntimeInfo={
  platform:string;
  arch:string;
  node:string;
  cwd:string;
  localAppData:string|null;
  shell:"web"|"desktop";
};
