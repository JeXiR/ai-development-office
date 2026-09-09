export type GitBranchInfo={
  name:string;
  current:boolean;
  upstream:string|null;
  ahead:number;
  behind:number;
};

export type GitCommitInfo={
  hash:string;
  shortHash:string;
  parents:string[];
  author:string;
  email:string;
  timestamp:string;
  subject:string;
  refs:string[];
};

export type GitGraphSnapshot={
  currentBranch:string|null;
  branches:GitBranchInfo[];
  commits:GitCommitInfo[];
};

export type GitFileDiff={
  path:string;
  status:string;
  additions:number;
  deletions:number;
  diff:string;
};

export type GitScopedDiff={
  scope:"working-tree"|"task"|"agent";
  scopeId:string|null;
  files:GitFileDiff[];
};

export type GitSnapshotMeta={
  id:string;
  projectId:string;
  createdAt:string;
  label:string;
  commit:string|null;
  branch:string|null;
  includeWorkingTree:boolean;
  patchFile:string|null;
};


export type GitBlameLine={
  line:number;
  commit:string;
  author:string;
  timestamp:string;
  content:string;
};

export type GitConflictFile={
  path:string;
  stages:string[];
  conflictMarkers:boolean;
};

export type AutoGitPolicy={
  autoBranch:boolean;
  autoCommit:boolean;
  branchPrefix:string;
  commitPrefix:string;
  requireCleanBase:boolean;
};

export type PullRequestDraft={
  provider:"github"|"gitlab"|"generic";
  title:string;
  body:string;
  sourceBranch:string;
  targetBranch:string;
  compareUrl:string|null;
};
