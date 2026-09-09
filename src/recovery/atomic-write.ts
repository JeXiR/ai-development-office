import fs from "node:fs";
import path from "node:path";

export function atomicWriteFile(file:string,content:string){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=`${file}.${process.pid}.${Date.now()}.tmp`;
  const fd=fs.openSync(tmp,"w");
  try{
    fs.writeFileSync(fd,content,"utf8");
    fs.fsyncSync(fd);
  }finally{
    fs.closeSync(fd);
  }
  fs.renameSync(tmp,file);
  try{
    const dirFd=fs.openSync(path.dirname(file),"r");
    fs.fsyncSync(dirFd);
    fs.closeSync(dirFd);
  }catch{}
}

export function atomicWriteJson(file:string,value:unknown){
  atomicWriteFile(file,JSON.stringify(value,null,2));
}
