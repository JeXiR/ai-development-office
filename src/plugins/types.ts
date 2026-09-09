export type PluginPermission="read_project"|"write_project"|"network"|"runtime"|"ui";

export type OfficePluginManifest={
  id:string;
  name:string;
  version:string;
  description:string;
  permissions:PluginPermission[];
  entry:string;
};

export type PluginHook=
  |"office.start"
  |"runtime.event"
  |"mission.before"
  |"mission.after"
  |"ledger.entry"
  |"project.changed";

export type PluginContext={
  projectId:string|null;
  emit:(event:string,payload:unknown)=>void;
};

export interface OfficePlugin{
  manifest:OfficePluginManifest;
  hooks?:Partial<Record<PluginHook,(payload:unknown,context:PluginContext)=>void|Promise<void>>>;
}
