import crypto from "node:crypto";
import type {ProviderHealth,ProviderManifest,UniversalProviderAdapter} from "../types";

export abstract class BaseProviderAdapter implements UniversalProviderAdapter{
  constructor(public readonly manifest:ProviderManifest){}
  protected sessions=new Set<string>();

  abstract detect():Promise<boolean>;
  abstract health():Promise<ProviderHealth>;
  abstract models():Promise<string[]>;
  abstract sendTask(sessionId:string,input:{prompt:string;tools?:unknown[]}):Promise<unknown>;

  async createSession(_input:{model?:string;system?:string}={}){
    const id=crypto.randomUUID();
    this.sessions.add(id);
    return {id};
  }

  async resumeSession(sessionId:string){
    this.sessions.add(sessionId);
    return {id:sessionId};
  }

  async cancel(_sessionId:string){return;}

  async usage(_sessionId:string){
    return {inputTokens:null,outputTokens:null,costUsd:null};
  }

  protected assertSession(sessionId:string){
    if(!this.sessions.has(sessionId))this.sessions.add(sessionId);
  }
}
