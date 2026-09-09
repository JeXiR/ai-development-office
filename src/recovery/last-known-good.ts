import fs from "node:fs";
import path from "node:path";

export type LastKnownGood={
  at:string;
  officeVersion:string;
  projectPath:string|null;
  checks:Record<string,boolean>;
};

export class LastKnownGoodStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"last-known-good.json");}
  write(snapshot:LastKnownGood){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify(snapshot,null,2)+"\n","utf8");
  }
  read():LastKnownGood|null{
    try{return JSON.parse(fs.readFileSync(this.file(),"utf8"));}catch{return null;}
  }
}
