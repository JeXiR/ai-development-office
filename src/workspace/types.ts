export type WorkspaceFileEntry={name:string;path:string;relativePath:string;type:"file"|"directory";size:number|null;modifiedAt:string|null};
export type WorkspaceFilePayload={projectId:string;path:string;relativePath:string;content:string;language:string;size:number;modifiedAt:string};
export type GitDiffFile={path:string;status:string;additions:number;deletions:number;diff:string};
