export type MemoryKind="lesson"|"decision"|"fact"|"warning"|"handoff"|"summary"|"history";

export type MemoryRecord={
  id:string;
  projectId:string;
  scope:"shared"|"agent";
  agentId:string|null;
  kind:MemoryKind;
  title:string;
  body:string;
  tags:string[];
  relatedTaskId:string|null;
  relatedArtifactIds:string[];
  importance:number;
  createdAt:string;
  updatedAt:string;
  lastAccessedAt:string|null;
  accessCount:number;
};

export type MemorySearchResult={
  memory:MemoryRecord;
  score:number;
  matchedTerms:string[];
};

export type MemorySnapshot={
  shared:MemoryRecord[];
  agents:Record<string,MemoryRecord[]>;
};
