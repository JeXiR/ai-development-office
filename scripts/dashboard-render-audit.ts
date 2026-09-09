import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const files:string[]=[];
function walk(dir:string){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))files.push(p);}}
walk(path.join(root,"src/components"));
const source=files.map(f=>fs.readFileSync(f,"utf8")).join("\n");
const css=fs.readFileSync(path.join(root,"src/app/globals.css"),"utf8");
const i18n=fs.readFileSync(path.join(root,"src/i18n/officeI18n.tsx"),"utf8");
for(const required of ["mission-workspace","mission-view","pixel-office-runtime","agent-squad"]){
  if(!source.includes(required)&&!css.includes(required))throw new Error(`Dashboard render dependency missing: ${required}`);
}
for(const key of ["nav.office","nav.workspace","nav.collaboration","nav.projects","nav.agents","pixel.subtitle"]){
  if(!i18n.includes(`"${key}"`))throw new Error(`Missing runtime i18n key: ${key}`);
}
if(source.includes("RELEASE CANDIDATE"))throw new Error("Stable UI still contains RELEASE CANDIDATE label");
if(!i18n.includes("legacy[language]?.[key]"))throw new Error("Legacy/runtime translations are not wired into t()");
console.log("Dashboard render audit PASS");
console.log(`component files scanned: ${files.length}`);
