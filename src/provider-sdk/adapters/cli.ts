import {execFile} from "node:child_process";
import fs from "node:fs";
import {promisify} from "node:util";
import {BaseProviderAdapter} from "./base";
import {commandAvailable,commandCandidates,commandVersion} from "../shell";
import {keepResolvedExecutable,ProviderResolver} from "../../providers/resolver";
import {preferWindowsCli,spawnEnv,wrapWindowsCli} from "../../providers/win-cli";
import type {ProviderHealth,ProviderManifest} from "../types";

const execFileAsync=promisify(execFile);

export class CliProviderAdapter extends BaseProviderAdapter{
  constructor(
    manifest:ProviderManifest,
    private readonly command:string,
    private readonly promptArgs:(prompt:string)=>string[]
  ){
    super(manifest);
  }

  private resolvedCommand(){
    if(this.manifest.id==="cursor"){
      const dedicated=new ProviderResolver().resolveExecutable("cursor");
      if(dedicated&&fs.existsSync(dedicated)&&keepResolvedExecutable("cursor",dedicated))return dedicated;
      const hits=commandCandidates(this.command).filter(file=>keepResolvedExecutable("cursor",file));
      const cursorHits=hits.filter(file=>/cursor-agent/i.test(file));
      return preferWindowsCli(cursorHits.length?cursorHits:hits);
    }
    return commandCandidates(this.command)[0]||null;
  }

  async detect(){
    if(this.manifest.id==="cursor")return Boolean(this.resolvedCommand());
    return commandAvailable(this.command);
  }

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    const cmd=this.resolvedCommand();
    const detected=Boolean(cmd);
    const version=this.manifest.id==="cursor"?null:(detected?await commandVersion(this.command):null);
    return {
      providerId:this.manifest.id,
      available:detected,
      latencyMs:Date.now()-started,
      checkedAt:new Date().toISOString(),
      detail:detected?(cmd||version||"CLI detected"):"CLI not found"
    };
  }

  async models(){return [];}

  async sendTask(sessionId:string,input:{prompt:string}){
    this.assertSession(sessionId);
    const cmd=this.resolvedCommand();
    if(!cmd)throw new Error(`${this.manifest.name} CLI is not installed.`);
    const wrapped=wrapWindowsCli(cmd,this.promptArgs(input.prompt));
    const {stdout,stderr}=await execFileAsync(wrapped.command,wrapped.args,{
      timeout:15*60*1000,
      maxBuffer:16*1024*1024,
      windowsHide:true,
      env:spawnEnv()
    });
    return {text:String(stdout||stderr||""),rawStderr:String(stderr||"")};
  }
}
