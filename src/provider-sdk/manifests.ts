import type {ProviderManifest} from "./types";

const base=(id:ProviderManifest["id"],name:string,transport:ProviderManifest["transport"],overrides:Partial<ProviderManifest["capabilities"]>={}):ProviderManifest=>({
  id,name,transport,
  capabilities:{
    coding:true,reasoning:true,toolCalling:true,structuredOutput:true,
    vision:false,streaming:true,sessionResume:true,local:false,
    ...overrides
  }
});

export const BUILTIN_PROVIDER_MANIFESTS:ProviderManifest[]=[
  {...base("openai","OpenAI / Codex","native-api",{vision:true}),credentialEnv:"OPENAI_API_KEY"},
  {...base("anthropic","Anthropic / Claude","native-api",{vision:true}),credentialEnv:"ANTHROPIC_API_KEY"},
  {...base("gemini","Google Gemini","native-api",{vision:true}),credentialEnv:"GEMINI_API_KEY"},
  {...base("xai","xAI / Grok","native-api",{vision:true}),credentialEnv:"XAI_API_KEY"},
  {...base("groq","Groq","openai-compatible"),credentialEnv:"GROQ_API_KEY"},
  base("cursor","Cursor","cli"),
  base("opencode","OpenCode","cli"),
  {...base("ollama","Ollama / Local","local-http",{toolCalling:false,sessionResume:false,local:true}),endpointEnv:"OLLAMA_HOST"},
  {...base("openai-compatible","OpenAI-Compatible Endpoint","openai-compatible"),credentialEnv:"OPENAI_COMPATIBLE_API_KEY",endpointEnv:"OPENAI_COMPATIBLE_BASE_URL"}
];
