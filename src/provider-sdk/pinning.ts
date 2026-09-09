import fs from "node:fs";
import path from "node:path";
import type {UniversalProviderId} from "./types";

export type AgentProviderPin={
  agentId:string;
  providerId:UniversalProviderId|"auto";
  model:string|null;
};

type PinFile={version:1;pins:AgentProviderPin[]};

export class AgentProviderPinStore{
  constructor(private readonly officeDataDir:string){}
  private file(){return path.join(this.officeDataDir,"provider-pins.json");}

  read():AgentProviderPin[]{
    try{
      const parsed=JSON.parse(fs.readFileSync(this.file(),"utf8")) as PinFile;
      return Array.isArray(parsed?.pins)?parsed.pins:[];
    }catch{return [];}
  }

  get(agentId:string){return this.read().find(x=>x.agentId===agentId)||null;}

  set(pin:AgentProviderPin){
    const pins=this.read().filter(x=>x.agentId!==pin.agentId);
    pins.push(pin);
    fs.mkdirSync(this.officeDataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify({version:1,pins},null,2)+"\\n","utf8");
  }

  remove(agentId:string){
    const pins=this.read().filter(x=>x.agentId!==agentId);
    fs.mkdirSync(this.officeDataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify({version:1,pins},null,2)+"\\n","utf8");
  }
}
