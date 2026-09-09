import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const src=path.join(root,"src");
const files:string[]=[];

function walk(dir:string){
  if(!fs.existsSync(dir))return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()){
      if(!["node_modules",".next"].includes(e.name))walk(p);
    }else if(/\.tsx$/.test(e.name))files.push(p);
  }
}
walk(src);

// Raw translation keys are a problem only when emitted as literal JSX text.
// Expressions such as {t("pixel.title")}, dictionary definitions, and labelKey
// metadata are valid and must not be flagged.
const rawKeys:string[]=[];
const literalRawKeyPattern=/>\s*((?:heading|nav|pixel)\.[a-zA-Z0-9_.-]+)\s*</g;
for(const file of files){
  const text=fs.readFileSync(file,"utf8");
  for(const m of text.matchAll(literalRawKeyPattern)){
    rawKeys.push(`${path.relative(root,file)}: ${m[1]}`);
  }
}
if(rawKeys.length)throw new Error(`Visible raw i18n keys found:\n${rawKeys.join("\n")}`);

const requiredLocalizedComponents=[
  "src/components/MissionRunner.tsx",
  "src/components/ProjectDocsIntelligencePanel.tsx",
  "src/components/settings/DesktopRuntimePanel.tsx",
  "src/components/settings/AccountConnectionsPanel.tsx",
  "src/components/settings/ProviderCredentialsPanel.tsx",
  "src/components/MissionHistoryPanel.tsx",
  "src/components/ApprovalInboxPanel.tsx",
  "src/components/AdaptiveRoutingPanel.tsx"
];
for(const rel of requiredLocalizedComponents){
  const text=fs.readFileSync(path.join(root,rel),"utf8");
  if(!text.includes("useOfficeI18n"))throw new Error(`Missing i18n hook in ${rel}`);
}

const forbiddenVisible=[
  "What should Office build, fix or review?",
  "Existing project docs",
  "Browser / Subscription Login",
  "SECURE PROVIDER CREDENTIALS",
  "Autonomous Execution History",
  "Guarded Mission Decisions",
  "Provider Performance Feedback"
];

for(const rel of requiredLocalizedComponents){
  const text=fs.readFileSync(path.join(root,rel),"utf8");
  for(const value of forbiddenVisible){
    const escaped=value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const jsxLiteral=new RegExp(`>\\s*${escaped}\\s*<`);
    if(jsxLiteral.test(text))throw new Error(`Hardcoded visible UI text "${value}" remains in ${rel}`);
  }
}

console.log("UI copy audit PASS");
