import fs from "node:fs";
import path from "node:path";

export class DistributedLogStore{
  file(projectPath:string,jobId:string){
    const file=path.join(projectPath,".ai-kit","workers","logs",`${jobId}.log`);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    return file;
  }

  append(projectPath:string,jobId:string,text:string){
    const file=this.file(projectPath,jobId);
    fs.appendFileSync(file,text,"utf8");
    return file;
  }

  read(projectPath:string,jobId:string,maxBytes=200000){
    const file=this.file(projectPath,jobId);
    if(!fs.existsSync(file))return "";
    const stat=fs.statSync(file);
    const start=Math.max(0,stat.size-maxBytes);
    const fd=fs.openSync(file,"r");
    try{
      const length=stat.size-start;
      const buffer=Buffer.alloc(length);
      fs.readSync(fd,buffer,0,length,start);
      return buffer.toString("utf8");
    }finally{fs.closeSync(fd);}
  }
}
