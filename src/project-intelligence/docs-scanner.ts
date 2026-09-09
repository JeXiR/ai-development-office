import fs from "node:fs";
import path from "node:path";
import type {ProjectDocsSnapshot,ProjectTaskItem,ProjectTaskStatus} from "./types";

const STATUS_WORDS:ProjectTaskStatus[]=[
  "VERIFIED_DONE","PARTIAL","TODO","BLOCKED","DEFERRED","UNKNOWN","DECISION_REQUIRED"
];

const SKIP_DIRS=new Set(["node_modules",".git","vendor","storage","dist","build",".next",".turbo",".cache","coverage"]);

function walk(dir:string,depth=0,maxDepth=3){
  if(!fs.existsSync(dir)||depth>maxDepth)return [];
  const out:string[]=[];
  let entries:fs.Dirent[]=[];
  try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return out;}
  for(const e of entries){
    if(SKIP_DIRS.has(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())out.push(...walk(p,depth+1,maxDepth));
    else out.push(p);
  }
  return out;
}

function statusFromLine(line:string):ProjectTaskStatus|null{
  for(const status of STATUS_WORDS)if(line.toUpperCase().includes(status))return status;
  if(/^\s*[-*]\s*\[\s\]\s+/.test(line))return "TODO";
  if(/^\s*[-*]\s*\[[xX]\]\s+/.test(line))return "VERIFIED_DONE";
  return null;
}

function titleFromLine(line:string){
  return line
    .replace(/^\s*[-*#]+\s*/,"")
    .replace(/^\[[xX\s]\]\s*/,"")
    .replace(/\b(VERIFIED_DONE|PARTIAL|TODO|BLOCKED|DEFERRED|UNKNOWN|DECISION_REQUIRED)\b[:\-\s]*/ig,"")
    .trim();
}

export function scanProjectDocs(projectPath:string):ProjectDocsSnapshot{
  const docsDir=path.join(projectPath,"docs");
  const rootFiles=walk(projectPath,0,0);
  const docsFiles=walk(docsDir,0,4);
  const files=[...new Set([...rootFiles,...docsFiles])]
    .filter(f=>/\.(md|markdown|txt|json)$/i.test(f))
    .filter(f=>!f.includes(`${path.sep}node_modules${path.sep}`)&&!f.includes(`${path.sep}.git${path.sep}`));

  const byName=(names:string[])=>files.find(f=>names.includes(path.basename(f).toUpperCase()))||null;
  const roadmapFile=byName(["ROADMAP.MD","TODO.MD","PLAN.MD"]);
  const progressFile=byName(["PROGRESS.MD","STATUS.MD"]);
  const stateFile=byName(["PROJECT_STATE.MD","PROJECT_STATE.JSON","STATE.MD"]);
  const decisionFiles=files.filter(f=>/decision/i.test(path.basename(f)));

  const tasks:ProjectTaskItem[]=[];
  const taskFiles=[roadmapFile,progressFile,stateFile,...decisionFiles].filter(Boolean) as string[];

  let seq=1;
  for(const file of taskFiles){
    let text="";
    try{text=fs.readFileSync(file,"utf8");}catch{continue}
    const lines=text.split(/\r?\n/);
    lines.forEach((line,index)=>{
      const status=statusFromLine(line);
      const title=titleFromLine(line);
      if(!status||!title||title.length<3)return;
      tasks.push({
        id:`doc-${seq++}`,
        title,
        status,
        sourceFile:file,
        sourceLine:index+1,
        raw:line
      });
    });
  }

  const warnings:string[]=[];
  if(!fs.existsSync(docsDir))warnings.push("docs directory not found");
  if(!roadmapFile)warnings.push("ROADMAP/TODO/PLAN file not found");
  if(!progressFile)warnings.push("PROGRESS/STATUS file not found");
  if(!stateFile)warnings.push("PROJECT_STATE file not found");

  return {
    projectPath:path.resolve(projectPath),
    docsDir,
    files,
    roadmapFile,
    progressFile,
    stateFile,
    decisionFiles,
    tasks,
    warnings
  };
}
