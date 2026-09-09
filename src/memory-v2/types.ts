export type MemoryCategory=
  |"architecture"
  |"decision"
  |"lesson"
  |"fact"
  |"warning"
  |"handoff"
  |"summary"
  |"specialization";

export type MemoryScope="shared"|"agent"|"task";

export type MemoryV2Record={
  id:string;
  projectId:string;
  category:MemoryCategory;
  scope:MemoryScope;
  agentId:string|null;
  taskId:string|null;
  title:string;
  body:string;
  tags:string[];
  embedding:number[]|null;
  embeddingModel:string|null;
  importance:number;
  confidence:number;
  accessCount:number;
  createdAt:string;
  updatedAt:string;
  lastAccessedAt:string|null;
  expiresAt:string|null;
  provenance:{
    sourceType:"user"|"agent"|"runtime"|"file"|"decision"|"migration";
    sourceId:string|null;
    actor:string|null;
  };
};

export type MemorySearchInput={
  query:string;
  agentId?:string|null;
  taskId?:string|null;
  categories?:MemoryCategory[];
  limit?:number;
};

export type MemorySearchHit={
  record:MemoryV2Record;
  score:number;
  lexicalScore:number;
  semanticScore:number;
};

export type EmbeddingProviderId="local-hash"|"openai-compatible";
