export type KitCapability={
  id:string;
  title:string;
  category:string;
  tags:string[];
  source:string;
};

export type KitSkill={
  id:string;
  title:string;
  path:string;
  capabilityIds:string[];
};

export type KitCommand={
  id:string;
  title:string;
  path:string;
};

export type KitWorkflow={
  id:string;
  title:string;
  path:string;
};

export type KitSnapshot={
  installed:boolean;
  root:string|null;
  locationMode:"embedded"|"developer-override"|"missing";
  version:string|null;
  skills:KitSkill[];
  commands:KitCommand[];
  workflows:KitWorkflow[];
  capabilities:KitCapability[];
  compositions:string[];
  warnings:string[];
};

export interface EmbeddedKitEngine{
  detect(projectPath?:string):Promise<KitSnapshot>;
  discoverProject(projectPath:string):Promise<Record<string,unknown>>;
  resolveCapabilities(projectPath:string):Promise<string[]>;
  syncProject(projectPath:string):Promise<void>;
  validate(projectPath?:string):Promise<{ok:boolean;warnings:string[]}>;
}
