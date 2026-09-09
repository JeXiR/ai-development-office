import type {AuthConnectionManifest} from "./types";

export const AUTH_CONNECTION_MANIFESTS:AuthConnectionManifest[]=[
  {
    id:"openai-codex",
    name:"OpenAI Codex / ChatGPT",
    providerId:"openai",
    modes:["browser-account","device-code","api-key"],
    preferredMode:"browser-account",
    command:"codex",
    loginArgs:["login"],
    statusArgs:["login","status"],
    logoutArgs:["logout"],
    accountUsageNotes:"Use existing ChatGPT/Codex account entitlement when available; API key remains optional fallback.",
    apiFallback:true
  },
  {
    id:"claude-code",
    name:"Anthropic Claude Code",
    providerId:"anthropic",
    modes:["interactive-cli","browser-account","api-key"],
    preferredMode:"browser-account",
    command:"claude",
    loginArgs:[],
    statusArgs:["doctor"],
    logoutArgs:[],
    accountUsageNotes:"Claude Code can authenticate through Claude App/Anthropic account flows; API and enterprise backends remain available.",
    apiFallback:true
  },
  {
    id:"gemini-cli",
    name:"Google Gemini CLI",
    providerId:"gemini",
    modes:["browser-account","api-key"],
    preferredMode:"browser-account",
    command:"gemini",
    loginArgs:[],
    statusArgs:["--version"],
    logoutArgs:[],
    accountUsageNotes:"Google account login can use available personal-account quota; API key/Vertex can be used for different limits or billing.",
    apiFallback:true
  },
  {
    id:"cursor-cli",
    name:"Cursor CLI",
    providerId:"cursor",
    modes:["browser-account","api-key"],
    preferredMode:"browser-account",
    command:"agent",
    loginArgs:["login"],
    statusArgs:["status"],
    logoutArgs:["logout"],
    accountUsageNotes:"Browser login uses the user's Cursor account; API key remains available for automation.",
    apiFallback:true
  },
  {
    id:"github-cli",
    name:"GitHub",
    providerId:null,
    modes:["browser-account","api-key"],
    preferredMode:"browser-account",
    command:"gh",
    loginArgs:["auth","login","--web"],
    statusArgs:["auth","status"],
    logoutArgs:["auth","logout"],
    accountUsageNotes:"Browser login connects Git/GitHub operations without manually managing a token.",
    apiFallback:true
  }
];
