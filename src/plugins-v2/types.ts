export const PLUGIN_API_VERSION="2.0";

export type PluginPermission=
  |"read_project"
  |"write_project"
  |"network"
  |"runtime"
  |"ui"
  |"provider"
  |"tool"
  |"trigger";

export type PluginHook=
  |"office.start"
  |"runtime.event"
  |"mission.before"
  |"mission.after"
  |"ledger.entry"
  |"project.changed"
  |"provider.route"
  |"tool.invoke"
  |"trigger.fire";

export type PluginManifestV2={
  id:string;
  name:string;
  version:string;
  apiVersion:string;
  entry:string;
  enabledByDefault:boolean;
  permissions:PluginPermission[];
  hooks:PluginHook[];
  contributes?:{
    providers?:Array<{id:string;label:string}>;
    tools?:Array<{id:string;label:string;description:string}>;
    triggers?:Array<{id:string;label:string}>;
    panels?:Array<{id:string;title:string}>;
  };
};

export type PluginRuntimeState={
  id:string;
  enabled:boolean;
  status:"idle"|"running"|"failed"|"disabled";
  failureCount:number;
  lastError:string|null;
  lastRunAt:string|null;
};

export type PluginInvocationContext={
  projectId:string;
  projectPath:string;
  actor:string;
  hook:PluginHook;
  payload:Record<string,unknown>;
};

export type PluginInvocationResult={
  ok:boolean;
  pluginId:string;
  hook:PluginHook;
  durationMs:number;
  data:unknown;
  error:string|null;
};
