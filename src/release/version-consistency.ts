import fs from "node:fs";
import path from "node:path";

export function verifyVersionConsistency(root:string,expected:string){
  const issues:string[]=[];

  const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
  if(pkg.version!==expected)issues.push(`package.json version ${pkg.version} != ${expected}`);

  const lockFile=path.join(root,"package-lock.json");
  if(fs.existsSync(lockFile)){
    const lock=JSON.parse(fs.readFileSync(lockFile,"utf8"));
    if(lock.version!==expected)issues.push(`package-lock.json version ${lock.version} != ${expected}`);
    if(lock.packages?.[""]?.version&&lock.packages[""].version!==expected){
      issues.push(`package-lock root version ${lock.packages[""].version} != ${expected}`);
    }
  }

  const manifest=JSON.parse(fs.readFileSync(path.join(root,"office.manifest.json"),"utf8"));
  if(manifest.version!==expected)issues.push(`office.manifest.json version ${manifest.version} != ${expected}`);

  return {ok:issues.length===0,issues,expected};
}
