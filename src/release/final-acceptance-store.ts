import fs from "node:fs";
import path from "node:path";
import type {ReleaseEvidenceBundle} from "./evidence-types";

export class FinalAcceptanceStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"final-acceptance.json");}

  read():ReleaseEvidenceBundle|null{
    try{return JSON.parse(fs.readFileSync(this.file(),"utf8"));}catch{return null;}
  }

  write(bundle:ReleaseEvidenceBundle){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify(bundle,null,2)+"\n","utf8");
    return bundle;
  }
}
