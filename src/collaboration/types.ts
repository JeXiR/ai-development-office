export type DirectorTaskStatus="planned"|"queued"|"working"|"blocked"|"done"|"failed";

export type DirectorTask={
  id:string;
  projectId:string;
  title:string;
  description:string;
  assignedRole:string;
  assignedAgentId:string|null;
  status:DirectorTaskStatus;
  dependencies:string[];
  acceptanceCriteria:string[];
  artifacts:string[];
  createdAt:string;
  updatedAt:string;
};

export type MailMessage={
  id:string;
  projectId:string;
  fromAgentId:string;
  toAgentId:string;
  subject:string;
  body:string;
  relatedTaskId:string|null;
  artifactIds:string[];
  createdAt:string;
  readAt:string|null;
};

export type BlackboardEntry={
  id:string;
  projectId:string;
  authorAgentId:string;
  category:"decision"|"fact"|"warning"|"handoff"|"note";
  title:string;
  body:string;
  relatedTaskId:string|null;
  createdAt:string;
  updatedAt:string;
};

export type CollaborationArtifact={
  id:string;
  projectId:string;
  producerAgentId:string;
  taskId:string|null;
  type:"file-set"|"report"|"diff"|"test-result"|"decision"|"handoff";
  title:string;
  payload:Record<string,unknown>;
  createdAt:string;
};

export type DirectorPlan={
  id:string;
  projectId:string;
  goal:string;
  tasks:DirectorTask[];
  createdAt:string;
};
