import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import type {GitBlameLine,GitBranchInfo,GitCommitInfo,GitConflictFile,GitFileDiff,GitGraphSnapshot,GitSnapshotMeta,PullRequestDraft} from "./types";

function run(cwd:string,args:string[],allowFailure=false,timeout=15000){
  try{
    return execFileSync("git",args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout,windowsHide:true,maxBuffer:8*1024*1024}).trim();
  }catch(error:any){
    if(allowFailure)return "";
    const stderr=String(error?.stderr||error?.stdout||error?.message||"Git command failed.");
    throw new Error(stderr.trim());
  }
}

function ensureRepo(cwd:string){
  const ok=run(cwd,["rev-parse","--is-inside-work-tree"],true)==="true";
  if(!ok)throw new Error("Project is not a Git repository.");
}

function parseNumstat(cwd:string,args:string[]){
  const raw=run(cwd,args,true);
  const map=new Map<string,{additions:number;deletions:number}>();
  for(const line of raw.split(/\r?\n/)){
    if(!line.trim())continue;
    const [a,d,...rest]=line.split("\t");
    const file=rest.join("\t");
    map.set(file,{
      additions:a==="-"?0:Number(a||0),
      deletions:d==="-"?0:Number(d||0)
    });
  }
  return map;
}

export class GitIntelligenceService{
  graph(projectPath:string,limit=120):GitGraphSnapshot{
    ensureRepo(projectPath);
    const currentBranch=run(projectPath,["branch","--show-current"],true)||null;

    const branchesRaw=run(projectPath,[
      "for-each-ref",
      "--format=%(refname:short)%09%(HEAD)%09%(upstream:short)%09%(upstream:track)",
      "refs/heads"
    ],true);

    const branches:GitBranchInfo[]=branchesRaw.split(/\r?\n/).filter(Boolean).map(line=>{
      const [name,head,upstream,track]=line.split("\t");
      const ahead=Number((track||"").match(/ahead (\d+)/)?.[1]||0);
      const behind=Number((track||"").match(/behind (\d+)/)?.[1]||0);
      return {name,current:head==="*",upstream:upstream||null,ahead,behind};
    });

    const sep="\x1f";
    const rec="\x1e";
    const log=run(projectPath,[
      "log",
      `-${Math.max(1,Math.min(500,limit))}`,
      "--decorate=short",
      `--pretty=format:%H${sep}%h${sep}%P${sep}%an${sep}%ae${sep}%aI${sep}%s${sep}%D${rec}`
    ],true);

    const commits:GitCommitInfo[]=log.split(rec).map(x=>x.trim()).filter(Boolean).map(row=>{
      const [hash,shortHash,parents,author,email,timestamp,subject,refs]=row.split(sep);
      return {
        hash,shortHash,
        parents:(parents||"").split(/\s+/).filter(Boolean),
        author,email,timestamp,subject,
        refs:(refs||"").split(",").map(x=>x.trim()).filter(Boolean)
      };
    });

    return {currentBranch,branches,commits};
  }

  workingTree(projectPath:string):GitFileDiff[]{
    ensureRepo(projectPath);
    const statusRaw=run(projectPath,["status","--porcelain=v1","-uall"],true);
    const stats=parseNumstat(projectPath,["diff","--numstat","HEAD"]);
    // List view only needs status + numstat. Per-file diffs lock the bridge on large dirty trees.
    return statusRaw.split(/\r?\n/).filter(Boolean).map(line=>{
      const status=line.slice(0,2).trim()||"??";
      const file=line.slice(3).trim().replace(/^.* -> /,"");
      const stat=stats.get(file)||{additions:0,deletions:0};
      return {path:file,status,additions:stat.additions,deletions:stat.deletions,diff:""};
    });
  }

  commitDiff(projectPath:string,from:string,to:string="HEAD"):GitFileDiff[]{
    ensureRepo(projectPath);
    const names=run(projectPath,["diff","--name-status",from,to],true);
    const stats=parseNumstat(projectPath,["diff","--numstat",from,to]);
    return names.split(/\r?\n/).filter(Boolean).map(line=>{
      const [status,...parts]=line.split("\t");
      const file=parts.at(-1)||"";
      const stat=stats.get(file)||{additions:0,deletions:0};
      return {
        path:file,status,
        additions:stat.additions,deletions:stat.deletions,
        diff:run(projectPath,["diff","--no-ext-diff",from,to,"--",file],true)
      };
    });
  }

  createBranch(projectPath:string,name:string){
    ensureRepo(projectPath);
    if(!/^[A-Za-z0-9._\/-]{1,120}$/.test(name))throw new Error("Invalid branch name.");
    run(projectPath,["switch","-c",name]);
    return this.graph(projectPath,40);
  }

  checkout(projectPath:string,name:string){
    ensureRepo(projectPath);
    if(!/^[A-Za-z0-9._\/-]{1,120}$/.test(name))throw new Error("Invalid branch name.");
    run(projectPath,["switch",name]);
    return this.graph(projectPath,40);
  }

  commit(projectPath:string,message:string,paths?:string[]){
    ensureRepo(projectPath);
    if(!message.trim())throw new Error("Commit message is required.");
    const name=run(projectPath,["config","user.name"],true);
    const email=run(projectPath,["config","user.email"],true);
    if(!name||!email)throw new Error("Git user.name and user.email must be set before committing.");
    if(paths?.length){
      for(const p of paths)run(projectPath,["add","--",p],false,60000);
    }else{
      run(projectPath,["add","-A"],false,60000);
    }
    const staged=run(projectPath,["diff","--cached","--name-only"],true);
    if(!staged)throw new Error("Nothing staged to commit.");
    run(projectPath,["commit","-m",message.trim()],false,45000);
    return run(projectPath,["rev-parse","HEAD"]);
  }

  createSnapshot(projectId:string,projectPath:string,label:string,includeWorkingTree=true):GitSnapshotMeta{
    ensureRepo(projectPath);
    const dir=path.join(projectPath,".ai-kit","snapshots");
    fs.mkdirSync(dir,{recursive:true});
    const id=crypto.randomUUID();
    const commit=run(projectPath,["rev-parse","HEAD"],true)||null;
    const branch=run(projectPath,["branch","--show-current"],true)||null;
    let patchFile:string|null=null;

    if(includeWorkingTree){
      let patch="";
      try{
        patch=execFileSync("git",["diff","--binary","HEAD"],{
          cwd:projectPath,
          encoding:"utf8",
          stdio:["ignore","pipe","pipe"],
          timeout:20000,
          windowsHide:true,
          maxBuffer:8*1024*1024
        });
      }catch{
        patch="";
      }
      if(patch){
        patchFile=path.join(dir,`${id}.patch`);
        fs.writeFileSync(patchFile,patch,"utf8");
      }
    }

    const meta:GitSnapshotMeta={
      id,projectId,createdAt:new Date().toISOString(),
      label:label||"Snapshot",commit,branch,includeWorkingTree,patchFile
    };
    fs.writeFileSync(path.join(dir,`${id}.json`),JSON.stringify(meta,null,2),"utf8");
    return meta;
  }

  listSnapshots(projectPath:string):GitSnapshotMeta[]{
    const dir=path.join(projectPath,".ai-kit","snapshots");
    if(!fs.existsSync(dir))return [];
    return fs.readdirSync(dir)
      .filter(x=>x.endsWith(".json"))
      .map(file=>{
        try{return JSON.parse(fs.readFileSync(path.join(dir,file),"utf8")) as GitSnapshotMeta;}
        catch{return null;}
      })
      .filter((x):x is GitSnapshotMeta=>!!x)
      .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }

  restoreSnapshot(projectPath:string,id:string){
    ensureRepo(projectPath);
    const dir=path.join(projectPath,".ai-kit","snapshots");
    const metaFile=path.join(dir,`${id}.json`);
    if(!fs.existsSync(metaFile))throw new Error("Snapshot not found.");
    const meta=JSON.parse(fs.readFileSync(metaFile,"utf8")) as GitSnapshotMeta;

    if(meta.commit){
      run(projectPath,["reset","--hard",meta.commit]);
    }
    if(meta.patchFile&&fs.existsSync(meta.patchFile)){
      const patch=fs.readFileSync(meta.patchFile,"utf8");
      const normalizedPatch=patch.endsWith("\n")?patch:patch+"\n";
      try{
        execFileSync("git",["apply","--whitespace=nowarn","-"],{
          cwd:projectPath,
          input:normalizedPatch,
          encoding:"utf8",
          stdio:["pipe","pipe","pipe"],
          timeout:15000,
          windowsHide:true
        });
      }catch(error:any){
        const stderr=String(error?.stderr||error?.message||"Git snapshot patch restore failed.");
        throw new Error(stderr.trim());
      }
    }
    return {restored:true,meta};
  }
  sideBySide(projectPath:string,file:string,from:string="HEAD"){
    ensureRepo(projectPath);
    const before=run(projectPath,["show",`${from}:${file}`],true);
    let after="";
    try{after=fs.readFileSync(path.join(projectPath,file),"utf8");}catch{}
    return {file,from,before,after};
  }

  blame(projectPath:string,file:string):GitBlameLine[]{
    ensureRepo(projectPath);
    const raw=run(projectPath,["blame","--line-porcelain","--",file],true);
    const lines=raw.split(/\r?\n/);
    const out:GitBlameLine[]=[];
    let commit="",author="",timestamp="",lineNo=0;
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      const header=line.match(/^([0-9a-f^]{8,40})\s+\d+\s+(\d+)(?:\s+\d+)?$/);
      if(header){commit=header[1];lineNo=Number(header[2]);continue;}
      if(line.startsWith("author "))author=line.slice(7);
      else if(line.startsWith("author-time "))timestamp=new Date(Number(line.slice(12))*1000).toISOString();
      else if(line.startsWith("\t"))out.push({line:lineNo,commit,author,timestamp,content:line.slice(1)});
    }
    return out;
  }

  conflicts(projectPath:string):GitConflictFile[]{
    ensureRepo(projectPath);
    const raw=run(projectPath,["diff","--name-only","--diff-filter=U"],true);
    return raw.split(/\r?\n/).filter(Boolean).map(file=>{
      const stages=run(projectPath,["ls-files","-u","--",file],true).split(/\r?\n/).filter(Boolean);
      let text="";
      try{text=fs.readFileSync(path.join(projectPath,file),"utf8");}catch{}
      return {path:file,stages,conflictMarkers:/^(<<<<<<<|=======|>>>>>>>)/m.test(text)};
    });
  }

  cherryPick(projectPath:string,commit:string){
    ensureRepo(projectPath);
    if(!/^[0-9a-fA-F]{7,40}$/.test(commit))throw new Error("Invalid commit hash.");
    run(projectPath,["cherry-pick",commit]);
    return run(projectPath,["rev-parse","HEAD"]);
  }

  rollback(projectPath:string,commit:string,mode:"soft"|"mixed"|"hard"="mixed"){
    ensureRepo(projectPath);
    if(!/^[0-9a-fA-F]{7,40}$/.test(commit))throw new Error("Invalid commit hash.");
    run(projectPath,["reset",`--${mode}`,commit]);
    return {ok:true,head:run(projectPath,["rev-parse","HEAD"])};
  }

  bisectPlan(projectPath:string,good:string,bad:string="HEAD"){
    ensureRepo(projectPath);
    if(!/^[0-9a-fA-F]{7,40}$/.test(good))throw new Error("Invalid good commit hash.");
    if(bad!=="HEAD"&&!/^[0-9a-fA-F]{7,40}$/.test(bad))throw new Error("Invalid bad commit hash.");
    const count=Number(run(projectPath,["rev-list","--count",`${good}..${bad}`],true)||0);
    const steps=count>0?Math.ceil(Math.log2(count+1)):0;
    return {good,bad,candidateCount:count,estimatedSteps:steps,commands:["git bisect start",`git bisect bad ${bad}`,`git bisect good ${good}`]};
  }

  scopedDiff(projectPath:string,scope:"task"|"agent",scopeId:string){
    ensureRepo(projectPath);
    const notesDir=path.join(projectPath,".ai-kit","provenance");
    const file=path.join(notesDir,"events.jsonl");
    if(!fs.existsSync(file))return {scope,scopeId,files:[]};
    const rows=fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(x=>{try{return JSON.parse(x);}catch{return null;}}).filter(Boolean);
    const commits=rows.filter((x:any)=>x.type==="git"&&x.action==="commit"&&(
      scope==="task"?x.sourceTaskId===scopeId:x.metadata?.agentId===scopeId
    )).map((x:any)=>x.metadata?.hash).filter(Boolean);
    if(!commits.length)return {scope,scopeId,files:[]};
    const from=`${commits[0]}^`;
    const to=commits[commits.length-1];
    return {scope,scopeId,files:this.commitDiff(projectPath,from,to)};
  }

  pullRequestDraft(projectPath:string,targetBranch:string="main",provider:"github"|"gitlab"|"generic"="generic"):PullRequestDraft{
    ensureRepo(projectPath);
    const sourceBranch=run(projectPath,["branch","--show-current"],true);
    const commits=run(projectPath,["log","--pretty=%s",`${targetBranch}..${sourceBranch}`],true).split(/\r?\n/).filter(Boolean);
    const title=commits[0]||`Merge ${sourceBranch} into ${targetBranch}`;
    const body=[
      `Source: ${sourceBranch}`,
      `Target: ${targetBranch}`,
      "",
      "Commits:",
      ...commits.map(x=>`- ${x}`)
    ].join("\n");
    return {provider,title,body,sourceBranch,targetBranch,compareUrl:null};
  }

}
