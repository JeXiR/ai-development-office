import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {BaseProviderAdapter} from "./base";
import {commandAvailable,commandCandidates,commandVersion} from "../shell";
import type {ProviderHealth,ProviderManifest} from "../types";

const execFileAsync=promisify(execFile);

export class CliProviderAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest,private readonly command:string,private readonly promptArgs:(prompt:string)=>string[]){
    super(manifest);
  }

  async detect(){return commandAvailable(this.command);}

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    const detected=await this.detect();
    const version=detected?await commandVersion(this.command):null;
    return {
      providerId:this.manifest.id,
      available:detected,
      latencyMs:Date.now()-started,
      checkedAt:new Date().toISOString(),
      detail:detected?(version||"CLI detected"):"CLI not found"
    };
  }

  async models(){return [];}

  async sendTask(sessionId:string,input:{prompt:string}){
    this.assertSession(sessionId);
    const cmd=commandCandidates(this.command)[0];
    if(!cmd)throw new Error(`${this.manifest.name} CLI is not installed.`);
    const {stdout,stderr}=await execFileAsync(cmd,this.promptArgs(input.prompt),{
      timeout:15*60*1000,
      maxBuffer:16*1024*1024,
      windowsHide:true
    });
    return {text:String(stdout||stderr||""),rawStderr:String(stderr||"")};
  }
}
