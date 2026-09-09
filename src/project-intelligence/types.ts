export type ProjectTaskStatus=
  |"VERIFIED_DONE"
  |"PARTIAL"
  |"TODO"
  |"BLOCKED"
  |"DEFERRED"
  |"UNKNOWN"
  |"DECISION_REQUIRED";

export type ProjectTaskItem={
  id:string;
  title:string;
  status:ProjectTaskStatus;
  sourceFile:string;
  sourceLine:number|null;
  raw:string;
};

export type ProjectDocsSnapshot={
  projectPath:string;
  docsDir:string;
  files:string[];
  roadmapFile:string|null;
  progressFile:string|null;
  stateFile:string|null;
  decisionFiles:string[];
  tasks:ProjectTaskItem[];
  warnings:string[];
};

export type ProjectBootstrapInput={
  projectPath:string;
  projectName:string;
  brief:string;
  goals?:string[];
  constraints?:string[];
};
