import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {currentTaskWorkItem,extractPlanPaths,stampImplementationPlan,withImplementationAllowedFiles} from "../src/coordination/plan-paths";

const plan=[
  "## Evidence",
  "- `.ai-kit/find-next-work-result.json` / `current-task.json` — selected OC-1",
  "- No `package.json`, tests, or CI",
  "- `src/greet.ts` — `return \"\"`",
  "| `.ai-kit/current-task.json` | Reflect OC-1 |",
  "| `PROGRESS.md` | After verify |",
  "| `docs/PROJECT_STATE.md` | Sync |"
].join("\n");

const paths=extractPlanPaths(plan);
if(!paths.includes("src/greet.ts"))throw new Error(`missing src/greet.ts: ${paths.join(",")}`);
if(!paths.includes("PROGRESS.md"))throw new Error("missing PROGRESS.md");
if(!paths.includes("docs/PROJECT_STATE.md"))throw new Error("missing docs/PROJECT_STATE.md");
if(paths.some(p=>p==="current-task.js"||p==="package.js"||p.endsWith("/current-task.js"))){
  throw new Error(`phantom truncated paths: ${paths.join(",")}`);
}
if(paths.includes("current-task.json")||paths.some(p=>p.startsWith(".ai-kit/"))){
  throw new Error(`kit noise leaked: ${paths.join(",")}`);
}
const prose=extractPlanPaths("Defer Frontend/Next.js and MySQL/Next.js kits; keep src/greet.ts");
if(prose.some(p=>/next\.js$/i.test(p)))throw new Error(`product name leaked as path: ${prose.join(",")}`);
if(!prose.includes("src/greet.ts"))throw new Error("prose filter dropped real src/greet.ts");

const root=fs.mkdtempSync(path.join(os.tmpdir(),"office-plan-paths-"));
fs.mkdirSync(path.join(root,"src"),{recursive:true});
fs.writeFileSync(path.join(root,"src","greet.ts"),"export function greet(){return \"\";}\n","utf8");
fs.writeFileSync(path.join(root,"PROGRESS.md"),"- [ ] oc\n","utf8");
const rooted=extractPlanPaths(plan,{root});
if(rooted.includes("package.json"))throw new Error("non-existent root package.json should be dropped");
if(!rooted.includes("src/greet.ts")||!rooted.includes("PROGRESS.md"))throw new Error(`rooted filter dropped real files: ${rooted.join(",")}`);

fs.mkdirSync(path.join(root,".ai-kit"),{recursive:true});
fs.writeFileSync(path.join(root,".ai-kit","current-task.json"),JSON.stringify({
  work_item_id:"OC-2",
  title:"OC-2 — Verify greet() returns office-click"
}),"utf8");
const bound=currentTaskWorkItem(root);
if(!bound||bound.workItemId!=="OC-2"||!bound.workItemTitle.includes("OC-2")){
  throw new Error(`current-task bind failed: ${JSON.stringify(bound)}`);
}
if(currentTaskWorkItem(path.join(root,"missing")))throw new Error("missing project should not bind");

const stamped=stampImplementationPlan("# ROAD-01-phase-15\n\nPlanning only. No product changes this turn.\n\n### 1. Problem\nShip webhooks.\n");
if(/Planning only/i.test(stamped))throw new Error("stamped plan still says planning only");
if(!/implementation turn/i.test(stamped))throw new Error("stamped plan missing implementation banner");
const allowed=withImplementationAllowedFiles(["docs/ROADMAP.md","routes/web.php"]);
if(!allowed.includes("app/**")||!allowed.includes("tests/**")||!allowed.includes("bootstrap/**")||!allowed.includes("docs/ROADMAP.md")){
  throw new Error(`implementation globs missing: ${allowed.join(",")}`);
}

console.log("Plan-paths smoke PASS");
