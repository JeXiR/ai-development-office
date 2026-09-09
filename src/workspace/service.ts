import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import type {GitDiffFile,WorkspaceFileEntry,WorkspaceFilePayload} from "./types";

const IGNORED=new Set([".git","node_modules",".next","vendor","storage","dist","build",".turbo",".env",".env.local",".env.production",".env.development",".env.test"]);
function inside(root:string,target:string){const r=path.resolve(root),t=path.resolve(target);return t===r||t.startsWith(r+path.sep);}
function safe(projectPath:string,relativePath:string){const target=path.resolve(projectPath,relativePath||".");if(!inside(projectPath,target))throw new Error("Workspace path escapes project root.");return target;}
function languageFor(file:string){if(file.toLowerCase().endsWith(".blade.php"))return "html";const ext=path.extname(file).toLowerCase();return ({".ts":"typescript",".tsx":"typescript",".js":"javascript",".jsx":"javascript",".json":"json",".md":"markdown",".php":"php",".css":"css",".html":"html",".yml":"yaml",".yaml":"yaml",".sql":"sql",".py":"python",".go":"go",".rs":"rust",".sh":"shell",".ps1":"powershell"} as Record<string,string>)[ext]||"plaintext";}

export class WorkspaceService{
 list(projectPath:string,relativePath="",depth=3):WorkspaceFileEntry[]{
  const root=safe(projectPath,relativePath); if(!fs.existsSync(root))return [];
  const out:WorkspaceFileEntry[]=[]; const max=Math.max(1,Math.min(depth,4));
  const walk=(dir:string,d:number)=>{if(d>max)return;for(const e of fs.readdirSync(dir,{withFileTypes:true}).filter(x=>!IGNORED.has(x.name)).sort((a,b)=>a.isDirectory()===b.isDirectory()?a.name.localeCompare(b.name):a.isDirectory()?-1:1)){const full=path.join(dir,e.name),st=fs.statSync(full),rel=path.relative(projectPath,full).replace(/\\/g,"/");out.push({name:e.name,path:full,relativePath:rel,type:e.isDirectory()?"directory":"file",size:e.isDirectory()?null:st.size,modifiedAt:st.mtime.toISOString()});if(e.isDirectory())walk(full,d+1);}};
  if(fs.statSync(root).isDirectory())walk(root,1); return out;
 }
 read(projectPath:string,relativePath:string):WorkspaceFilePayload{
  const full=safe(projectPath,relativePath),st=fs.statSync(full); if(!st.isFile())throw new Error("Requested workspace path is not a file."); if(st.size>2*1024*1024)throw new Error("File is too large for the Office editor.");
  return {projectId:"",path:full,relativePath:path.relative(projectPath,full).replace(/\\/g,"/"),content:fs.readFileSync(full,"utf8"),language:languageFor(full),size:st.size,modifiedAt:st.mtime.toISOString()};
 }
 write(projectPath:string,relativePath:string,content:string){const full=safe(projectPath,relativePath);if(Buffer.byteLength(content,"utf8")>2*1024*1024)throw new Error("Editor payload exceeds 2 MB.");fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content,"utf8");const st=fs.statSync(full);return {relativePath:path.relative(projectPath,full).replace(/\\/g,"/"),size:st.size,modifiedAt:st.mtime.toISOString()};}
 gitDiff(projectPath:string):GitDiffFile[]{
  try{
    const status=execFileSync("git",["-C",projectPath,"status","--porcelain=v1","-uno"],{encoding:"utf8",timeout:12000,windowsHide:true});
    const rows=status.split(/\r?\n/).filter(Boolean).slice(0,40);
    let combined="";
    try{combined=execFileSync("git",["-C",projectPath,"diff","--no-color"],{encoding:"utf8",maxBuffer:4*1024*1024,timeout:15000,windowsHide:true});}catch{}
    const byFile=new Map<string,string>();
    let current="";
    let buf:string[]=[];
    for(const line of combined.split(/\r?\n/)){
      const m=line.match(/^diff --git a\/(.+) b\/(.+)$/);
      if(m){
        if(current)byFile.set(current,buf.join("\n"));
        current=m[2];
        buf=[line];
      }else if(current)buf.push(line);
    }
    if(current)byFile.set(current,buf.join("\n"));
    return rows.map(row=>{
      const s=row.slice(0,2).trim()||"M";
      const file=row.slice(3).trim().replace(/^"|"$/g,"");
      const diff=byFile.get(file)||"";
      let additions=0,deletions=0;
      for(const line of diff.split(/\r?\n/)){
        if(line.startsWith("+++ ")||line.startsWith("--- "))continue;
        if(line.startsWith("+"))additions++;
        if(line.startsWith("-"))deletions++;
      }
      return {path:file,status:s,additions,deletions,diff};
    });
  }catch(error){
    throw new Error(error instanceof Error?error.message:"Git diff failed.");
  }
 }
}
