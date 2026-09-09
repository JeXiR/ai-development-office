export const OFFICE_STATE_SCHEMA_VERSION=2;

export type VersionedStateEnvelope<T=unknown>={
  schemaVersion:number;
  writtenAt:string;
  payload:T;
};
