import crypto from "node:crypto";
import type {EmbeddingProviderId} from "./types";

export interface EmbeddingProvider{
  id:EmbeddingProviderId;
  model:string;
  embed(text:string):Promise<number[]>;
}

function normalize(v:number[]){
  const mag=Math.sqrt(v.reduce((n,x)=>n+x*x,0))||1;
  return v.map(x=>x/mag);
}

export class LocalHashEmbeddingProvider implements EmbeddingProvider{
  id:EmbeddingProviderId="local-hash";
  model="local-hash-v1";
  constructor(private readonly dimensions=128){}

  async embed(text:string){
    const vector=new Array(this.dimensions).fill(0);
    const tokens=text.toLowerCase().match(/[a-z0-9_./-]+/g)||[];
    for(const token of tokens){
      const digest=crypto.createHash("sha256").update(token).digest();
      const bucket=((digest[0]<<8)|digest[1])%this.dimensions;
      const sign=(digest[2]&1)===0?1:-1;
      vector[bucket]+=sign*(1+Math.min(3,token.length/8));
    }
    return normalize(vector);
  }
}

export class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider{
  id:EmbeddingProviderId="openai-compatible";
  constructor(
    public model:string,
    private readonly endpoint:string,
    private readonly apiKey:string|null
  ){}

  async embed(text:string){
    const headers:Record<string,string>={"content-type":"application/json"};
    if(this.apiKey)headers.authorization=`Bearer ${this.apiKey}`;
    const response=await fetch(this.endpoint,{
      method:"POST",
      headers,
      body:JSON.stringify({model:this.model,input:text}),
      signal:AbortSignal.timeout(20000)
    });
    if(!response.ok)throw new Error(`Embedding HTTP ${response.status}`);
    const raw:any=await response.json();
    const vector=raw?.data?.[0]?.embedding;
    if(!Array.isArray(vector))throw new Error("Embedding response missing vector.");
    return vector.map(Number);
  }
}

export function cosineSimilarity(a:number[]|null,b:number[]|null){
  if(!a||!b||a.length!==b.length||!a.length)return 0;
  let dot=0,ma=0,mb=0;
  for(let i=0;i<a.length;i++){
    dot+=a[i]*b[i];
    ma+=a[i]*a[i];
    mb+=b[i]*b[i];
  }
  if(!ma||!mb)return 0;
  return dot/(Math.sqrt(ma)*Math.sqrt(mb));
}
