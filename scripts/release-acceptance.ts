import fs from "node:fs";
import path from "node:path";
import {runCase,printResults} from "./lib/test-harness";

const root=process.cwd();

async function main(){
  const results=[];

  results.push(await runCase("manifest version matches package",()=>{
    const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
    const manifest=JSON.parse(fs.readFileSync(path.join(root,"office.manifest.json"),"utf8"));
    if(pkg.version!==manifest.version)throw new Error(`${pkg.version} != ${manifest.version}`);
  }));

  results.push(await runCase("critical docs exist",()=>{
    const required=[
      "README.md",
      "docs/V2_MASTER_ROADMAP.md",
      "docs/V2_RUNTIME_ARCHITECTURE.md",
      "docs/V2_PROVIDER_ARCHITECTURE.md",
      "docs/V2_PIXEL_OFFICE_ARCHITECTURE.md",
      "docs/V2_GIT_INTELLIGENCE.md",
      "docs/V2_REPRODUCIBILITY.md",
      "docs/V2_INTEGRATIONS.md",
      "docs/V2_REMOTE_WORKERS.md",
      "docs/V2_RECOVERY_REPLAY.md"
    ];
    const missing=required.filter(file=>!fs.existsSync(path.join(root,file)));
    if(missing.length)throw new Error(`missing docs: ${missing.join(", ")}`);
  }));

  results.push(await runCase("no DOM translation hack",()=>{
    const i18n=fs.readFileSync(path.join(root,"src/i18n/officeI18n.tsx"),"utf8");
    if(i18n.includes("MutationObserver")||i18n.includes("translateRoot"))throw new Error("legacy DOM translation hack detected");
  }));

  results.push(await runCase("no static xterm client imports",()=>{
    const files=[
      "src/components/workspace/LiveTerminal.tsx",
      "src/components/pixel-office/TerminalModal.tsx"
    ];
    for(const file of files){
      const text=fs.readFileSync(path.join(root,file),"utf8");
      if(/from ["']@xterm\//.test(text))throw new Error(`static xterm import in ${file}`);
    }
  }));

  results.push(await runCase("stable release metadata is internally consistent",()=>{
    const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
    const manifest=JSON.parse(fs.readFileSync(path.join(root,"office.manifest.json"),"utf8"));
    if(pkg.version!==manifest.version)throw new Error("package/manifest version mismatch");
    const versionParts=String(pkg.version).split(".");
    if(versionParts.length!==3||versionParts.some((x:string)=>!/^[0-9]+$/.test(x)))throw new Error("stable release must use semver without RC suffix");
    if(manifest.release?.channel!=="stable")throw new Error("stable release channel expected");
    if(manifest.release?.finalValidationPending!==true)throw new Error("validation must remain pending until final acceptance completes");
    if(manifest.release?.stableGateUnlocked!==false)throw new Error("stable gate must remain locked until final acceptance completes");
  }));

  printResults(results);
}

main().catch(error=>{console.error(error);process.exit(1);});
