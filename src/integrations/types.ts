export type IntegrationId=
  |"mcp"
  |"github"
  |"gitlab"
  |"slack"
  |"discord"
  |"webhook"
  |"jira"
  |"linear"
  |"notion"
  |"sentry"
  |"ci";

export type IntegrationConfig={
  id:IntegrationId;
  enabled:boolean;
  label:string;
  endpoint:string|null;
  tokenEnv:string|null;
  metadata:Record<string,string>;
};

export type IntegrationStatus={
  id:IntegrationId;
  configured:boolean;
  enabled:boolean;
  endpoint:string|null;
  credentialPresent:boolean;
  message:string;
};

export type McpServerConfig={
  id:string;
  command:string;
  args:string[];
  env:Record<string,string>;
  enabled:boolean;
};
