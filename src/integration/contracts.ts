export type IntegrationSubsystem=
  |"kit"
  |"docs"
  |"mission"
  |"providers"
  |"auth"
  |"project-execution"
  |"safety"
  |"evidence"
  |"pixel-office"
  |"desktop";

export type IntegrationCheck={
  id:string;
  subsystem:IntegrationSubsystem;
  ok:boolean;
  severity:"info"|"warning"|"error";
  message:string;
  evidence?:unknown;
};

export type IntegrationSnapshot={
  at:string;
  checks:IntegrationCheck[];
  errors:number;
  warnings:number;
  ready:boolean;
};
