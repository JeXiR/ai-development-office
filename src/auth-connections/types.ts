export type AuthConnectionId=
  |"openai-codex"
  |"claude-code"
  |"gemini-cli"
  |"cursor-cli"
  |"github-cli";

export type AuthMode="browser-account"|"api-key"|"device-code"|"interactive-cli";

export type AuthConnectionManifest={
  id:AuthConnectionId;
  name:string;
  providerId:string|null;
  modes:AuthMode[];
  preferredMode:AuthMode;
  command:string;
  loginArgs:string[];
  statusArgs:string[];
  logoutArgs:string[];
  accountUsageNotes:string;
  apiFallback:boolean;
};

export type AuthConnectionState={
  id:AuthConnectionId;
  name:string;
  installed:boolean;
  authenticated:boolean;
  statusText:string;
  preferredMode:AuthMode;
  apiFallback:boolean;
  accountUsageNotes:string;
};
