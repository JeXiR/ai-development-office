import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const file=fs.readFileSync(path.join(root,"src/i18n/officeI18n.tsx"),"utf8");

function parseDict(name:string){
  const start=file.indexOf(`const ${name}:Dict={`);
  if(start<0)throw new Error(`Missing dictionary ${name}`);
  const bodyStart=start+`const ${name}:Dict={`.length;
  const end=file.indexOf("\n};",bodyStart);
  const body=file.slice(bodyStart,end);
  const keys=[...body.matchAll(/"([^"]+)"\s*:/g)].map(x=>x[1]);
  return new Set(keys);
}

const en=parseDict("en"),tr=parseDict("tr"),de=parseDict("de"),ru=parseDict("ru");
for(const [name,set] of [["tr",tr],["de",de],["ru",ru]] as const){
  const missing=[...en].filter(k=>!set.has(k));
  if(missing.length)throw new Error(`${name} missing ${missing.length} keys: ${missing.join(", ")}`);
}

const i18nFile=fs.readFileSync(path.join(root,"src/i18n/officeI18n.tsx"),"utf8");
for(const term of ["MutationObserver","translateRoot"]){
  if(i18nFile.includes(term))throw new Error(`Banned legacy i18n term "${term}" found in officeI18n.tsx`);
}

const sourceFiles:string[]=[];
const walk=(dir:string)=>{
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()){if(entry.name!=="node_modules")walk(p);}
    else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(p);
  }
};
walk(path.join(root,"src"));
const misleading=sourceFiles.filter(p=>fs.readFileSync(p,"utf8").includes("STABLE / FEATURE FROZEN"));
if(misleading.length)throw new Error(`Misleading RC label found in: ${misleading.map(p=>path.relative(root,p)).join(", ")}`);

console.log(`i18n audit PASS — ${en.size} keys complete in tr/en/de/ru`);


const requiredCoreKeys=[
  "office.title","nav.office","nav.workspace","nav.collaboration","nav.projects","nav.agents","nav.skills",
  "nav.tasks","nav.inbox","nav.findings","nav.analytics","nav.memory","nav.release","nav.settings",
  "pixel.title","pixel.subtitle","pixel.liveTasks","pixel.taskFlow","pixel.noTasks",
  "heading.workspace","heading.collaboration","heading.projects","heading.agents","heading.skills","heading.tasks",
  "heading.inbox","heading.findings","heading.analytics","heading.memory","heading.release","heading.settings",
  "mission.title","docs.title","desktop.title","accounts.title","credentials.title"
];
const i18nSource=fs.readFileSync(path.join(root,"src/i18n/officeI18n.tsx"),"utf8");
for(const key of requiredCoreKeys){
  if(!i18nSource.includes(`"${key}"`))throw new Error(`Missing required core i18n key: ${key}`);
}

const usedKeys=new Set<string>();
for(const file of sourceFiles){
  const text=fs.readFileSync(file,"utf8");
  for(const match of text.matchAll(/\bt\(\s*["']([^"']+)["']/g))usedKeys.add(match[1]);
}
const unresolved=[...usedKeys].filter(key=>!i18nSource.includes(`"${key}"`));
if(unresolved.length)throw new Error(`Unresolved i18n keys: ${unresolved.sort().join(", ")}`);
console.log(`i18n usage scan PASS — ${usedKeys.size} referenced keys resolved`);
