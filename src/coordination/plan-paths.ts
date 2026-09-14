import fs from "node:fs";
import path from "node:path";

/** Longest extension first so `package.json` is not captured as `package.js`. */
const PATH_RX=/([A-Za-z0-9_.@/-]+\.(?:tsx|jsx|json|yaml|yml|scss|php|sql|css|vue|py|go|rs|md|ts|js))\b/gim;

const ROOT_DOC=new Set(["progress.md","readme.md","license.md","changelog.md","roadmap.md"]);
const PRODUCT_BASENAMES=new Set(["next.js","node.js","vue.js"]);

const KIT_BASENAMES=new Set([
  "current-task.json",
  "backlog-canonical.json",
  "office-work-items.json",
  "office-findings.json",
  "find-next-work-result.json",
  "backlog-harvest-result.json",
  "project-profile.json",
  "installed-skills.json"
]);

export type ExtractPlanPathOptions={
  root?:string;
};

function normalizePlanPath(raw:string){
  return raw.replace(/\\/g,"/").replace(/^\.?\//,"");
}

function isKitNoise(file:string){
  if(file.startsWith("node_modules/")||file.startsWith(".ai-kit/")||file.startsWith("ai-kit/"))return true;
  const base=file.split("/").pop()||file;
  return !file.includes("/")&&KIT_BASENAMES.has(base);
}

function keepPlannedFile(file:string, root?:string){
  if(isKitNoise(file))return false;
  const base=(file.split("/").pop()||"").toLowerCase();
  if(PRODUCT_BASENAMES.has(base))return false;
  if(!root)return true;
  if(fs.existsSync(path.join(root,file)))return true;
  if(file.includes("/"))return true;
  return ROOT_DOC.has(file.toLowerCase());
}

export const IMPLEMENTATION_FILE_GLOBS=[
  "app/**",
  "database/**",
  "tests/**",
  "resources/**",
  "lang/**",
  "routes/**",
  "config/**",
  "public/**",
  "src/**",
  "bootstrap/**",
  "phpunit.xml",
  "phpunit.xml.dist"
];

export function withImplementationAllowedFiles(owned:string[]){
  return [...new Set([...owned.filter(Boolean),...IMPLEMENTATION_FILE_GLOBS])];
}

export function stampImplementationPlan(plan:string){
  let text=String(plan||"");
  const banner="This **is** the implementation turn. Ship product files + tests. Planning-only / docs-only close is a **fail**.";
  text=text.replace(/^Planning only[^\n]*\n+/im,"");
  text=text.replace(/\nPlanning only[^\n]*/gi,"\n");
  text=text.replace(/Do not implement anything[^\n]*/gi,"");
  if(/this \*\*is\*\* the implementation turn/i.test(text))return text.endsWith("\n")?text:text+"\n";
  if(/^#\s+/m.test(text)){
    text=text.replace(/^(#\s+[^\n]+)\n+/, `$1\n\n${banner}\n\n`);
  }else{
    text=`${banner}\n\n${text}`;
  }
  return text.replace(/\n{3,}/g,"\n\n").replace(/\s*$/,"\n");
}

export function extractPlanPaths(plan:string, options:ExtractPlanPathOptions={}){
  const out=new Set<string>();
  const text=String(plan||"");
  PATH_RX.lastIndex=0;
  let m:RegExpExecArray|null;
  while((m=PATH_RX.exec(text))){
    const file=normalizePlanPath(m[1]||"");
    if(!file||!keepPlannedFile(file, options.root))continue;
    out.add(file);
  }
  return [...out].slice(0,40);
}

export function currentTaskWorkItem(projectPath:string){
  try{
    const raw=JSON.parse(fs.readFileSync(path.join(projectPath,".ai-kit","current-task.json"),"utf8")) as Record<string,unknown>;
    const workItemId=String(raw.work_item_id||raw.workItemId||"").trim();
    if(!workItemId)return null;
    return {workItemId, workItemTitle:String(raw.title||"").trim()};
  }catch{
    return null;
  }
}
