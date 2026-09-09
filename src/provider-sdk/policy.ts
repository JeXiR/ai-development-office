import fs from "node:fs";
import path from "node:path";
import type {UniversalProviderId} from "./types";

export type ProviderPreferenceMode="balanced"|"quality"|"cost"|"latency";

export type ProviderFallbackPolicy={
  order:UniversalProviderId[];
  maxAttempts:number;
  allowLocal:boolean;
};

export type ProviderPolicy={
  version:1;
  preference:ProviderPreferenceMode;
  fallback:ProviderFallbackPolicy;
  providerWeights:Partial<Record<UniversalProviderId,number>>;
};

export const DEFAULT_PROVIDER_POLICY:ProviderPolicy={
  version:1,
  preference:"balanced",
  fallback:{
    order:["cursor","anthropic","openai","gemini","xai","groq","opencode","ollama","openai-compatible"],
    maxAttempts:3,
    allowLocal:true
  },
  providerWeights:{}
};

export class ProviderPolicyStore{
  constructor(private readonly officeDataDir:string){}
  private file(){return path.join(this.officeDataDir,"provider-policy.json");}

  read():ProviderPolicy{
    try{
      const parsed=JSON.parse(fs.readFileSync(this.file(),"utf8"));
      return {
        ...DEFAULT_PROVIDER_POLICY,
        ...parsed,
        fallback:{...DEFAULT_PROVIDER_POLICY.fallback,...(parsed?.fallback||{})},
        providerWeights:{...(parsed?.providerWeights||{})}
      };
    }catch{return DEFAULT_PROVIDER_POLICY;}
  }

  write(policy:ProviderPolicy){
    fs.mkdirSync(this.officeDataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify(policy,null,2)+"\n","utf8");
  }
}
