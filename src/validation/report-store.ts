import fs from "node:fs";
import path from "node:path";

export class ValidationReportStore{
  constructor(private readonly dataDir:string){}
  private dir(){return path.join(this.dataDir,"validation-reports");}
  write(name:string,data:unknown){
    fs.mkdirSync(this.dir(),{recursive:true});
    const safe=name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const file=path.join(this.dir(),`${safe}.json`);
    fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n","utf8");
    return file;
  }
  read(name:string){
    try{
      const safe=name.replace(/[^a-zA-Z0-9._-]/g,"_");
      return JSON.parse(fs.readFileSync(path.join(this.dir(),`${safe}.json`),"utf8"));
    }catch{return null;}
  }
}
