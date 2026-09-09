import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { loadEnvFile } from "node:process";
import { generateFeatureContracts, generateProjectCoverage } from "./coverage-engine";

const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) loadEnvFile(envLocal);

const dataRoot =
  process.env.OFFICE_DATA_DIR ||
  (process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "AI-Development-Office")
    : path.join(os.homedir(), ".ai-development-office"));

fs.mkdirSync(dataRoot, { recursive: true });

const projectsFile = path.join(dataRoot, "projects.json");
const commandHistoryFile = path.join(dataRoot, "command-history.json");

type Project = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
};

type Finding = {
  id: string;
  severity: "BLOCKER" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  status: "open" | "working" | "fixed" | "deferred";
  firstSeenAt?: string | null;
  updatedAt?: string | null;
  fixedAt?: string | null;
  assignedRole?: string | null;
  lastResult?: string | null;
};

const lastStates = new Map<string, string>();

function slug(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "project";
}

function projects(): Project[] {
  if (!fs.existsSync(projectsFile)) {
    const first = process.env.OFFICE_PROJECT_PATH;
    const initial = first ? [{
      id: slug(path.basename(first)),
      name: path.basename(first),
      path: path.resolve(first),
      enabled: true,
    }] : [];
    fs.writeFileSync(projectsFile, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    return JSON.parse(fs.readFileSync(projectsFile, "utf8"));
  } catch {
    return [];
  }
}

function read(file: string) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

function readJson(file: string): any {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; }
}

function readJsonArray(file: string): any[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function matchOne(text: string, re: RegExp) {
  return text.match(re)?.[1]?.trim() ?? null;
}

function countProgress(progress: string) {
  const done = (progress.match(/- \[x\]/gi) ?? []).length;
  const todo = (progress.match(/- \[ \]/g) ?? []).length;
  const partial = (progress.match(/\bPARTIAL\b/g) ?? []).length + (progress.match(/\[~\]/g) ?? []).length;

  const bugsSection = progress.match(/## Bugs \/ Errors([\s\S]*?)(?:\n## |\s*$)/i)?.[1] ?? "";
  const bugs = (bugsSection.match(/- \[ \]/g) ?? []).length;

  const blockerSection = progress.match(/## Blockers([\s\S]*?)(?:\n## |\s*$)/i)?.[1] ?? "";
  const blockers = /No blockers recorded|None recorded/i.test(blockerSection)
    ? 0
    : (blockerSection.match(/- \[ \]/g) ?? []).length;

  return { done, partial, todo, bugs, blockers };
}

function health(c: ReturnType<typeof countProgress>) {
  if (c.blockers) return "critical";
  if (c.bugs || c.partial) return "warning";
  return "healthy";
}

function parseFindingLines(text: string): Finding[] {
  const out: Finding[] = [];
  const now = new Date().toISOString();

  for (const severity of ["BLOCKER", "HIGH", "MEDIUM", "LOW", "INFO"] as const) {
    const sectionRegex = new RegExp(
      `\\*\\*${severity}\\*\\*([\\s\\S]*?)(?=\\n\\*\\*(?:BLOCKER|HIGH|MEDIUM|LOW|INFO)\\*\\*|\\n## |$)`,
      "i"
    );
    const section = text.match(sectionRegex)?.[1] ?? "";

    for (const rawLine of section.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line.startsWith("-")) continue;

      const checked = line.match(/^-\s+\[([xX ])\]\s+(H\d+|M\d+|L\d+|I\d+)\s+(.+)/);
      if (checked) {
        out.push({
          id: checked[2],
          severity,
          title: checked[3].replace(/~~/g, "").trim(),
          status: checked[1].toLowerCase() === "x" ? "fixed" : "open",
          updatedAt: now,
          fixedAt: checked[1].toLowerCase() === "x" ? now : null,
        });
        continue;
      }

      const plain = line.match(/^-\s+(H\d+|M\d+|L\d+|I\d+)\s+(.+)/i);
      if (plain) {
        const struck = /~~/.test(plain[2]);
        out.push({
          id: plain[1],
          severity,
          title: plain[2].replace(/~~/g, "").trim(),
          status: struck ? "fixed" : "open",
          updatedAt: now,
          fixedAt: struck ? now : null,
        });
      }
    }
  }

  return out;
}


function findingHasResolvedEvidence(finding:any){
  const text=[
    finding?.title,
    finding?.description,
    ...(Array.isArray(finding?.evidence)?finding.evidence:[]),
    finding?.lastResult
  ].filter(Boolean).join(" ");

  const explicitFixed=/\*\*FIXED\*\*|\bFIXED\b|\bRESOLVED\b|\bre-verified\b|\breverified\b/i.test(text);
  const canonicalSecurityId=/^(?:H|M)\d+$/i.test(String(finding?.id||""));
  return explicitFixed && (canonicalSecurityId || /\bre-verified\b|\breverified\b/i.test(text));
}

function canonicalFindingsAllFixed(project:Project){
  const backlog=readCanonicalBacklog(project);
  return String(backlog?.findingsStatus||"").toLowerCase().includes("h1-h14 fixed");
}

function reconcileFindings(project: Project, progress: string, securityAudit: string): Finding[] {
  const ai = path.join(project.path, ".ai-kit");
  const ledgerPath = path.join(ai, "office-findings.json");
  const previous = readJsonArray(ledgerPath) as Finding[];
  const previousById = new Map(previous.map((f) => [f.id, f]));

  // Prefer PROGRESS severity sections, augment from security audit if present.
  const currentMap = new Map<string, Finding>();
  for (const f of [...parseFindingLines(progress), ...parseFindingLines(securityAudit)]) {
    if (!currentMap.has(f.id)) currentMap.set(f.id, f);
  }

  const commandHistory = readJsonArray(commandHistoryFile);
  const now = new Date().toISOString();

  for (const [id, current] of currentMap) {
    const old = previousById.get(id);
    const related = commandHistory.find((c) => c.projectId === project.id && c.findingId === id);

    current.firstSeenAt = old?.firstSeenAt || now;
    current.updatedAt = now;
    current.assignedRole = related?.assignedRole || old?.assignedRole || null;
    current.lastResult = related?.message || old?.lastResult || null;

    if (related?.status === "running") current.status = "working";
    if (related?.status === "completed" && current.status !== "fixed") {
      // Completion alone is not enough to claim fixed while docs still list it open.
      current.status = "open";
    }

    if (current.status === "fixed") {
      current.fixedAt = old?.fixedAt || now;
    }
  }

  // Preserve history for findings no longer listed.
  for (const old of previous) {
    if (currentMap.has(old.id)) continue;

    const relatedCompleted = commandHistory.find(
      (c) => c.projectId === project.id && c.findingId === old.id && c.status === "completed"
    );

    currentMap.set(old.id, {
      ...old,
      status: relatedCompleted ? "fixed" : old.status,
      updatedAt: now,
      fixedAt: relatedCompleted ? (old.fixedAt || relatedCompleted.completedAt || now) : old.fixedAt,
      lastResult: relatedCompleted?.message || old.lastResult || null,
      assignedRole: relatedCompleted?.assignedRole || old.assignedRole || null,
    });
  }

  const list = [...currentMap.values()].sort((a, b) => {
    const statusOrder = { working: 0, open: 1, fixed: 2, deferred: 3 };
    const severityOrder = { BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return statusOrder[a.status] - statusOrder[b.status] ||
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  fs.writeFileSync(ledgerPath, JSON.stringify(list, null, 2));
  
// Canonical/evidence reconciliation: explicit FIXED + re-verified evidence,
// or the canonical H1-H14 fixed statement, wins over stale historic runner failures.
const canonicalFixed=canonicalFindingsAllFixed(project);
const reconciled=list.map((finding:any)=>{
  const fixedByEvidence=findingHasResolvedEvidence(finding);
  const fixedByCanonical=canonicalFixed && /^H(?:[1-9]|1[0-4])$/i.test(String(finding?.id||""));
  if((fixedByEvidence||fixedByCanonical) && finding.status!=="fixed"){
    return {
      ...finding,
      status:"fixed",
      fixedAt:finding.fixedAt||finding.updatedAt||nowIso(),
      updatedAt:nowIso(),
      lastResult: fixedByEvidence
        ? "Reconciled as fixed from explicit FIXED/re-verified evidence."
        : "Reconciled as fixed from canonical security backlog state."
    };
  }
  return finding;
});
fs.writeFileSync(ledgerPath,JSON.stringify(reconciled,null,2));
return reconciled;

}


function readRecentEvents(project:Project,limit=120){
  const file=path.join(project.path,".ai-kit","events.jsonl");
  const text=read(file);
  if(!text)return[];
  const lines=text.split(/\r?\n/).filter(Boolean).slice(-limit);
  const out:any[]=[];
  for(const line of lines){try{out.push(JSON.parse(line));}catch{}}
  return out;
}

function liveAgentOverlay(project:Project){
  const events=readRecentEvents(project,120);
  const now=Date.now();
  const overlay:Record<string,{status:string;task:string|null;timestamp:number}>={};

  const actorKey=(event:any)=>{
    const id=String(event.actor?.id||"").toLowerCase();
    if(id)return id;
    return String(event.actor?.role||"").toLowerCase();
  };

  for(const event of events){
    const ts=Date.parse(event.timestamp||"");
    if(!Number.isFinite(ts))continue;
    const age=now-ts;
    if(age>15*60*1000)continue;

    const id=actorKey(event);
    if(!id)continue;

    let status=String(event.status||"idle");
    if(event.event_type==="task_started"){
      status=status==="planning"?"planning":
        id==="qa"?"testing":
        id==="security"?"reviewing":"working";
    }
    if(event.event_type==="validation"){
      status=id==="qa"?"testing":"reviewing";
    }
    if(event.event_type==="task_completed")status="done";
    if(event.event_type==="error")status="error";
    if(event.event_type==="blocked")status="blocked";
    if(event.event_type==="waiting")status="waiting";

    const existing=overlay[id];
    if(!existing||ts>=existing.timestamp){
      overlay[id]={status,task:event.task||event.message||null,timestamp:ts};
    }
  }

  const commands=readJsonArray(commandHistoryFile).filter((c:any)=>c.projectId===project.id);
  for(const command of commands){
    const id=normalizedAgentKey(String(command.assignedRole||command.assignedAgentId||command.executionLane||""));
    if(!id||id==="general")continue;
    const ts=Date.parse(command.updatedAt||command.createdAt||"");
    if(!Number.isFinite(ts))continue;
    const status=command.status==="planning"?"planning":
      command.status==="verifying"?"testing":
      ["queued","waiting_for_agent","running"].includes(command.status)?"working":
      command.status==="completed"?"done":
      command.status==="failed"?"error":null;
    if(!status)continue;
    const existing=overlay[id];
    if(!existing||ts>=existing.timestamp){
      overlay[id]={status,task:command.title||command.command||null,timestamp:ts};
    }
  }

  // Completed/done should decay to idle; active states have longer TTL.
  for(const [id,value] of Object.entries(overlay)){
    const age=now-value.timestamp;
    const ttl=value.status==="done"?45*1000:
      ["working","testing","reviewing","planning"].includes(value.status)?8*60*1000:
      3*60*1000;
    if(age>ttl)delete overlay[id];
  }
  return overlay;
}


type OrgAgent={
  id:string;role:string;kind:"core"|"specialist";scope:"active"|"candidate"|"disabled";
  capabilities:string[];source:string[];homeRoom:string;priority:number;
};

const CORE_ORG:OrgAgent[]=[
  {id:"ceo",role:"CEO",kind:"core",scope:"active",capabilities:["governance"],source:["office-core"],homeRoom:"ceo",priority:100},
  {id:"cto",role:"CTO",kind:"core",scope:"active",capabilities:["technical-governance","architecture-approval"],source:["office-core"],homeRoom:"ceo",priority:95},
  {id:"pm",role:"PM",kind:"core",scope:"active",capabilities:["planning","dependency-management"],source:["office-core"],homeRoom:"conference",priority:90},
  {id:"architect",role:"Architect",kind:"core",scope:"active",capabilities:["architecture","implementation-planning"],source:["office-core"],homeRoom:"conference",priority:90},
  {id:"docs",role:"Docs",kind:"core",scope:"active",capabilities:["documentation","state-reconciliation"],source:["office-core"],homeRoom:"knowledge",priority:80},
  {id:"devops",role:"DevOps",kind:"core",scope:"active",capabilities:["ci-cd","deployment","runtime"],source:["office-core"],homeRoom:"ops",priority:85},
  {id:"qa",role:"QA",kind:"core",scope:"active",capabilities:["testing","verification"],source:["office-core"],homeRoom:"quality",priority:85},
  {id:"security",role:"Security",kind:"core",scope:"active",capabilities:["security","risk-review"],source:["office-core"],homeRoom:"quality",priority:90},
];

const SPECIALIST_RULES:Array<{
  id:string;role:string;homeRoom:string;patterns:RegExp[];capabilities:string[];priority:number;
}>=[
  {id:"frontend",role:"Frontend",homeRoom:"engineering",patterns:[/frontend\.web\.nextjs/i,/\bnext\.?js\b/i,/\breact\b/i],capabilities:["frontend"],priority:80},
  {id:"nextjs",role:"Next.js Specialist",homeRoom:"engineering",patterns:[/frontend\.web\.nextjs/i,/\bnext\.?js\b/i],capabilities:["frontend.web.nextjs"],priority:84},
  {id:"backend",role:"Backend",homeRoom:"engineering",patterns:[/backend\./i,/\bapi\b/i,/\bcontroller\b/i],capabilities:["backend"],priority:80},
  {id:"laravel",role:"Laravel Specialist",homeRoom:"engineering",patterns:[/backend\.laravel/i,/\blaravel\b/i,/"laravel\/framework"/i],capabilities:["backend.laravel","runtime.php"],priority:86},
  {id:"nestjs",role:"NestJS Specialist",homeRoom:"engineering",patterns:[/backend\.nestjs/i,/\bnestjs\b/i,/@nestjs\//i],capabilities:["backend.nestjs","runtime.node"],priority:86},
  {id:"database",role:"Database",homeRoom:"engineering",patterns:[/database\./i,/\bmysql\b/i,/\bpostgres/i,/\bprisma\b/i],capabilities:["database"],priority:78},
  {id:"mysql",role:"MySQL Specialist",homeRoom:"engineering",patterns:[/database\.mysql/i,/\bmysql\b/i],capabilities:["database.mysql"],priority:82},
  {id:"postgres",role:"Postgres Specialist",homeRoom:"engineering",patterns:[/database\.postgres/i,/\bpostgres(?:ql)?\b/i],capabilities:["database.postgres"],priority:82},
  {id:"flutter",role:"Flutter Specialist",homeRoom:"engineering",patterns:[/frontend\.mobile\.flutter/i,/\bflutter\b/i,/\bpubspec\.yaml\b/i],capabilities:["frontend.mobile.flutter"],priority:90},
  {id:"expo",role:"Expo Specialist",homeRoom:"engineering",patterns:[/frontend\.mobile\.expo/i,/\bexpo\b/i],capabilities:["frontend.mobile.expo"],priority:88},
  {id:"react-native",role:"React Native Specialist",homeRoom:"engineering",patterns:[/react[- ]native/i],capabilities:["frontend.mobile.react-native"],priority:86},
  {id:"redis",role:"Redis Specialist",homeRoom:"ops",patterns:[/cache\.redis/i,/\bredis\b/i],capabilities:["cache.redis"],priority:75},
  {id:"worker",role:"Worker / Queue Specialist",homeRoom:"ops",patterns:[/jobs\.worker/i,/jobs\.bullmq/i,/\bbullmq\b/i,/\bqueue worker\b/i],capabilities:["jobs.worker"],priority:76},
  {id:"ai",role:"AI Specialist",homeRoom:"knowledge",patterns:[/ai\.provider-router/i,/\bopenai\b/i,/\banthropic\b/i,/\bdeepseek\b/i,/\bgemini\b/i,/\bllm\b/i],capabilities:["ai"],priority:84},
  {id:"aws",role:"AWS Specialist",homeRoom:"ops",patterns:[/infra\.aws/i,/\baws\b/i,/\bs3\b/i],capabilities:["infra.aws"],priority:82},
  {id:"docker",role:"Docker Specialist",homeRoom:"ops",patterns:[/infra\.docker/i,/\bdocker(?:file|-compose)?\b/i],capabilities:["infra.docker"],priority:72},
  {id:"observability",role:"Observability Specialist",homeRoom:"ops",patterns:[/\bobservability\b/i,/\bopentelemetry\b/i,/\bsentry\b/i,/\bmetrics\b/i],capabilities:["observability"],priority:76},
  {id:"billing",role:"Billing Specialist",homeRoom:"engineering",patterns:[/\bstripe\b/i,/\bbilling\b/i,/\bpayment\b/i],capabilities:["billing"],priority:78},
  {id:"api",role:"API Specialist",homeRoom:"engineering",patterns:[/\bopenapi\b/i,/\bswagger\b/i,/\bapi contract\b/i],capabilities:["api"],priority:77},
];

function organizationEvidence(project:Project){
  const sources:string[]=[];
  const chunks:string[]=[];
  const candidates=[
    ".ai-kit/project-readiness.json",
    ".ai-kit/project-profile.json",
    ".ai-kit/resolved-capabilities.json",
    ".ai-kit/capabilities.json",
    ".ai-kit/project-capabilities.json",
    "docs/architecture/STACK.generated.md",
    "docs/architecture/STACK.md",
    "package.json","composer.json","pubspec.yaml"
  ];
  for(const rel of candidates){
    const file=path.join(project.path,...rel.split("/"));
    const text=read(file);
    if(text){chunks.push(`SOURCE:${rel}\n${text}`);sources.push(rel);}
  }

  // Folder names are weak evidence: useful for candidate discovery, not enough by themselves.
  const docsDir=path.join(project.path,"docs");
  if(fs.existsSync(docsDir)){
    try{
      const names=fs.readdirSync(docsDir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
      chunks.push(`DOC_FOLDERS:${names.join(",")}`);
      sources.push("docs/*");
    }catch{}
  }
  return {text:chunks.join("\n").slice(0,900000),sources};
}

function activeScopeEvidence(project:Project,ruleId:string,sourceText:string){
  const low=sourceText.toLowerCase();
  if(ruleId==="flutter"){
    return fs.existsSync(path.join(project.path,"pubspec.yaml")) ||
      /frontend\.mobile\.flutter|"flutter"|active.*flutter|flutter.*active/i.test(sourceText);
  }
  if(ruleId==="expo"){
    return fs.existsSync(path.join(project.path,"app.json")) && /expo/i.test(read(path.join(project.path,"package.json"))) ||
      /frontend\.mobile\.expo|active.*expo/i.test(sourceText);
  }
  if(ruleId==="laravel")return fs.existsSync(path.join(project.path,"artisan")) || /backend\.laravel/i.test(sourceText);
  if(ruleId==="nestjs")return /@nestjs\//i.test(read(path.join(project.path,"package.json"))) || /backend\.nestjs/i.test(sourceText);
  if(ruleId==="nextjs")return /\bnext\b/i.test(read(path.join(project.path,"package.json"))) || /frontend\.web\.nextjs/i.test(sourceText);
  if(ruleId==="mysql")return /database\.mysql|DB_CONNECTION\s*=\s*mysql|"mysql"/i.test(sourceText);
  if(ruleId==="postgres")return /database\.postgres|postgresql|DB_CONNECTION\s*=\s*pgsql/i.test(sourceText);
  if(ruleId==="aws")return /infra\.aws|active.*aws|\baws-sdk\b|@aws-sdk\//i.test(sourceText);
  if(ruleId==="docker")return fs.existsSync(path.join(project.path,"Dockerfile")) || fs.existsSync(path.join(project.path,"docker-compose.yml")) || /infra\.docker/i.test(sourceText);
  return true;
}

function resolveOrganization(project:Project){
  const {text,sources}=organizationEvidence(project);
  const active:OrgAgent[]=[];
  const candidates:OrgAgent[]=[];
  const detected=new Set<string>();

  for(const rule of SPECIALIST_RULES){
    const hits=rule.patterns.filter(rx=>rx.test(text));
    if(!hits.length)continue;

    for(const cap of rule.capabilities)detected.add(cap);
    const strong=activeScopeEvidence(project,rule.id,text);

    const agent:OrgAgent={
      id:rule.id,role:rule.role,kind:"specialist",scope:strong?"active":"candidate",
      capabilities:rule.capabilities,source:sources,homeRoom:rule.homeRoom,priority:rule.priority
    };

    (strong?active:candidates).push(agent);
  }

  // Avoid noisy generic duplicates when a concrete framework specialist exists.
  const hasConcreteBackend=active.some(x=>["laravel","nestjs"].includes(x.id));
  const hasConcreteFrontend=active.some(x=>["nextjs","flutter","expo","react-native"].includes(x.id));
  const filtered=active.filter(x=>{
    if(x.id==="backend"&&hasConcreteBackend)return false;
    if(x.id==="frontend"&&hasConcreteFrontend)return false;
    return true;
  }).sort((a,b)=>b.priority-a.priority||a.role.localeCompare(b.role));

  const organization={
    projectId:project.id,generatedAt:new Date().toISOString(),
    core:CORE_ORG,specialists:filtered,candidates,
    detectedCapabilities:[...detected].sort()
  };

  const ai=path.join(project.path,".ai-kit");
  fs.mkdirSync(ai,{recursive:true});
  fs.writeFileSync(path.join(ai,"office-organization.json"),JSON.stringify(organization,null,2));
  return organization;
}

function normalizedAgentKey(value:string){
  return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}


function commandLane(value:any){
  return String(value?.executionLane||value?.assignedRole||"general")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"general";
}

function roleSprintProgress(projectId:string,agentId:string,role:string){
  const commands=readJsonArray(commandHistoryFile)
    .filter((c:any)=>c.projectId===projectId && (c.workItemId||c.findingId));

  const normalizedRole=normalizedAgentKey(role);
  const relevant=commands.filter((c:any)=>{
    const lane=commandLane(c);
    return lane===agentId||lane===normalizedRole||normalizedAgentKey(String(c.assignedRole||""))===agentId;
  });

  if(!relevant.length)return {percent:null,queueCount:0,total:0,completed:0};

  // Prefer latest sprint/group for a meaningful percent rather than lifetime history.
  const latest=relevant.sort((a:any,b:any)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")))[0];
  const group=latest.sprintId||latest.queueGroupId;
  const sprint=group?relevant.filter((c:any)=>(c.sprintId||c.queueGroupId)===group):[latest];

  const terminal=sprint.filter((c:any)=>["completed","failed","cancelled"].includes(c.status)).length;
  const completed=sprint.filter((c:any)=>c.status==="completed").length;
  const active=sprint.filter((c:any)=>["planning","plan_ready","running","verifying"].includes(c.status)).length;
  const queued=sprint.filter((c:any)=>["queued","waiting_for_agent"].includes(c.status)).length;

  // Progress is sprint-stage based: only completed tasks count as complete.
  const percent=sprint.length?Math.round(completed/sprint.length*100):null;
  return {percent,queueCount:queued,total:sprint.length,completed,active};
}

function agents(project:Project, task:any, findings:Finding[]){
  const command=String(task.command??"").toLowerCase();
  const title=String(task.title??task.next_step??"Waiting");
  const activeFinding=findings.find(f=>f.status==="working");
  const live=liveAgentOverlay(project);
  const org=resolveOrganization(project);
  const definitions=[...org.core,...org.specialists];

  return definitions.map(def=>{
    const id=def.id;
    let status="idle";
    let agentTask:string|null=null;

    if(activeFinding){
      if(id==="ceo"){status="planning";agentTask=`Coordinate ${activeFinding.id}`;}
      if(id==="cto"){status="reviewing";agentTask=`Technical oversight ${activeFinding.id}`;}
      const assigned=normalizedAgentKey(String(activeFinding.assignedRole||""));
      if(assigned===id||assigned===normalizedAgentKey(def.role)){
        status=id==="qa"?"testing":id==="security"?"reviewing":"working";
        agentTask=`${activeFinding.id} ${activeFinding.title}`;
      }
    }

    if(command.includes("status")&&["ceo","cto","pm","docs"].includes(id)){
      status="reading";agentTask="Read project state";
    }

    if(command.includes("review project")||command.includes("review-project")){
      if(id==="ceo"){status="planning";agentTask="Coordinate audit";}
      else if(id==="cto"){status="reviewing";agentTask="Technical governance review";}
      else if(id==="pm"){status="planning";agentTask="Audit scope / dependencies";}
      else if(id==="architect"){status="reviewing";agentTask="Architecture audit";}
      else if(id==="qa"){status="testing";agentTask="Test audit";}
      else if(id==="security"){status="reviewing";agentTask="Security audit";}
      else if(id==="docs"){status="reading";agentTask="Docs reconciliation";}
      else if(def.kind==="specialist"){status="reviewing";agentTask=`${def.role} coverage audit`;}
    }

    if(command.includes("validate")){
      if(id==="qa"){status="testing";agentTask="Validation gates";}
      if(id==="security"){status="reviewing";agentTask="Security validation";}
      if(id==="devops"){status="testing";agentTask="Build / CI validation";}
      if(id==="cto"){status="reviewing";agentTask="Release technical review";}
    }

    // Match real telemetry by exact agent id first, then normalized role.
    const liveState=live[id]||live[normalizedAgentKey(def.role)];
    if(liveState){
      status=liveState.status;
      agentTask=liveState.task||agentTask;
    }

    const sprint=roleSprintProgress(project.id,id,def.role);
    return {
      id,role:def.role,status,task:agentTask,skill:null,file:null,
      kind:def.kind,scope:def.scope,capabilities:def.capabilities,source:def.source,
      homeRoom:def.homeRoom,progressPercent:sprint.percent,queueCount:sprint.queueCount,
      sprintTotal:sprint.total,sprintCompleted:sprint.completed
    };
  });
}

type WorkItem = {
  id:string; projectId:string; type:string; title:string; description?:string|null;
  status:string; priority:string; source:string; sourceFile?:string|null; sourceLine?:number|null;
  assignedRole?:string|null; evidence?:string[]; acceptanceCriteria?:string[];
  createdAt:string; updatedAt:string; completedAt?:string|null; commandId?:string|null; deferredReason?:string|null;
  lastResult?:string|null;
  lastSeenAt?:string|null; resolvedAt?:string|null; resolutionEvidence?:string[];
  verificationStatus?:"unverified"|"pending_reaudit"|"verified"|"failed";
};

function nowIso(){ return new Date().toISOString(); }

const HARVEST_NOISE_SOURCES=new Set(["frontend-audit","coverage","feature-contract"]);
const PRODUCT_WORK_SOURCES=new Set(["canonical-backlog","roadmap","progress","todo","security-audit","test-gaps","project-state"]);

function workPriorityFromText(text:string){
  const t=text.toLowerCase();
  if(/\b(blocker|critical)\b/.test(t))return "critical";
  if(/\b(high|security|credential|idor|auth|oauth|password|secret|tenant isolation)\b/.test(t))return "high";
  if(/\b(medium|test gap|coverage|docker|ci|queue|storage|export)\b/.test(t))return "medium";
  if(/\b(low|cleanup|refactor)\b/.test(t))return "low";
  return "info";
}

function productDocPriority(text:string){
  const priority=workPriorityFromText(text);
  return priority==="info"?"medium":priority;
}

function harvestScanPriority(status:string){
  return status==="missing"?"low":"info";
}

function workSortRank(item:{source?:string;priority?:string;id?:string}){
  const source=String(item.source||"");
  const sourceRank=PRODUCT_WORK_SOURCES.has(source)?(
    source==="canonical-backlog"?0:source==="security-audit"?1:source==="roadmap"?2:source==="progress"?3:4
  ):HARVEST_NOISE_SOURCES.has(source)?20:10;
  const pri={critical:0,high:1,medium:2,low:3,info:4}[String(item.priority||"info")]??5;
  return sourceRank*10+pri;
}

function typeFromText(text:string){
  const t=text.toLowerCase();
  if(/security|auth|credential|secret|idor|cors|oauth|password|mfa/.test(t))return "security";
  if(/frontend|ui|react|inertia|responsive|accessibility|css|page|screen|form/.test(t))return "frontend";
  if(/test|coverage|isolation|phpunit|regression/.test(t))return "test";
  if(/docker|ci|deploy|queue worker|worker|s3|infra|ops/.test(t))return "devops";
  if(/database|mysql|postgres|migration/.test(t))return "database";
  if(/docs|documentation|roadmap|todo|readme/.test(t))return "docs";
  if(/api|controller|service|laravel|backend/.test(t))return "backend";
  return "feature";
}


function specialistRoleForText(text:string,type:string){
  const t=text.toLowerCase();
  if(/\bflutter\b/.test(t))return "Flutter Specialist";
  if(/\bexpo\b/.test(t))return "Expo Specialist";
  if(/react[- ]native/.test(t))return "React Native Specialist";
  if(/\blaravel\b/.test(t))return "Laravel Specialist";
  if(/\bnestjs\b|@nestjs/.test(t))return "NestJS Specialist";
  if(/\bnext\.?js\b/.test(t))return "Next.js Specialist";
  if(/\bmysql\b/.test(t))return "MySQL Specialist";
  if(/\bpostgres(?:ql)?\b/.test(t))return "Postgres Specialist";
  if(/\bredis\b/.test(t))return "Redis Specialist";
  if(/\baws\b|\bs3\b/.test(t))return "AWS Specialist";
  if(/\bstripe\b|\bbilling\b|\bpayment\b/.test(t))return "Billing Specialist";
  if(/\bopenai\b|\banthropic\b|\bllm\b|\bai provider\b/.test(t))return "AI Specialist";
  if(/\bopenapi\b|\bswagger\b|\bapi contract\b/.test(t))return "API Specialist";
  if(/\bobservability\b|\bsentry\b|\bopentelemetry\b/.test(t))return "Observability Specialist";
  return null;
}

function roleForWork(type:string,text=""){
  const specialist=specialistRoleForText(text,type);
  if(specialist)return specialist;
  const map:Record<string,string>={
    security:"Security",frontend:"Frontend",backend:"Backend",test:"QA",
    docs:"Docs",devops:"DevOps",database:"Database",feature:"Architect",
    refactor:"Architect",decision:"CEO"
  };
  return map[type]||"Backend";
}

function safeId(prefix:string,text:string,index:number){
  const slug=text.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,34);
  return `${prefix}-${String(index+1).padStart(2,"0")}-${slug||"item"}`;
}

function harvestCheckboxLines(
  project:Project,
  fileRel:string,
  source:string,
  prefix:string,
  includeDone=false
):WorkItem[]{
  const file=path.join(project.path,...fileRel.split("/"));
  const text=read(file);
  if(!text)return[];
  const lines=text.split(/\r?\n/);
  const out:WorkItem[]=[];
  let seq=0;

  lines.forEach((line,i)=>{
    const checkbox=line.match(/^\s*-\s+\[([ xX])\]\s+(.+?)\s*$/);
    if(!checkbox)return;
    const done=checkbox[1].toLowerCase()==="x";
    if(done&&!includeDone)return;
    let title=checkbox[2].replace(/\*\*/g,"").replace(/~~/g,"").trim();
    if(!title||/none recorded/i.test(title))return;
    const deferred=/deferred/i.test(title);
    const type=typeFromText(title);
    out.push({
      id:safeId(prefix,title,seq++),projectId:project.id,type,title,
      description:null,status:done?"done":deferred?"deferred":"todo",
      priority:source==="roadmap"?productDocPriority(title):workPriorityFromText(title),source,sourceFile:fileRel,sourceLine:i+1,
      assignedRole:roleForWork(type),evidence:[`${fileRel}:${i+1}`],acceptanceCriteria:[],
      createdAt:nowIso(),updatedAt:nowIso(),completedAt:done?nowIso():null,
      deferredReason:deferred?"Marked deferred in source docs":null
    });
  });
  return out;
}

function harvestProgressTodo(project:Project):WorkItem[]{
  const text=read(path.join(project.path,"PROGRESS.md"));
  if(!text)return[];
  const section=text.match(/## Todo([\s\S]*?)(?:\n## |\s*$)/i)?.[1]||"";
  const lines=section.split(/\r?\n/);
  const out:WorkItem[]=[];
  let seq=0;
  lines.forEach((line,i)=>{
    const m=line.match(/^\s*-\s+(.+)/);
    if(!m)return;
    const title=m[1].replace(/\*\*/g,"").trim();
    if(!title)return;
    const deferred=/deferred/i.test(title);
    const type=typeFromText(title);
    out.push({
      id:safeId("PROG",title,seq++),projectId:project.id,type,title,
      status:deferred?"deferred":"todo",priority:productDocPriority(title),source:"progress",
      sourceFile:"PROGRESS.md",assignedRole:roleForWork(type),evidence:["PROGRESS.md"],
      acceptanceCriteria:[],createdAt:nowIso(),updatedAt:nowIso(),
      deferredReason:deferred?"Marked deferred in PROGRESS.md":null
    });
  });
  return out;
}

function harvestNextActions(project:Project):WorkItem[]{
  const text=read(path.join(project.path,"PROGRESS.md"));
  if(!text)return[];
  const section=text.match(/## Next Actions([\s\S]*?)(?:\n## |\s*$)/i)?.[1]||"";
  const lines=section.split(/\r?\n/);
  const out:WorkItem[]=[];
  let seq=0;
  lines.forEach((line)=>{
    const m=line.match(/^\s*\d+\.\s+(.+)/);
    if(!m)return;
    const title=m[1].replace(/\*\*/g,"").trim();
    if(!title||/do not re-scaffold/i.test(title))return;
    const type=typeFromText(title);
    out.push({
      id:safeId("NEXT",title,seq++),projectId:project.id,type,title,status:"todo",
      priority:productDocPriority(title),source:"progress",sourceFile:"PROGRESS.md",
      assignedRole:roleForWork(type),evidence:["PROGRESS.md#Next Actions"],acceptanceCriteria:[],
      createdAt:nowIso(),updatedAt:nowIso()
    });
  });
  return out;
}

function scanFrontend(project:Project){
  const candidates=[
    "resources/js/Pages","resources/js/pages","src/pages","src/app","app/frontend"
  ];
  const pages:string[]=[];
  for(const rel of candidates){
    const dir=path.join(project.path,...rel.split("/"));
    if(!fs.existsSync(dir))continue;
    const walk=(d:string)=>{
      for(const entry of fs.readdirSync(d,{withFileTypes:true})){
        const full=path.join(d,entry.name);
        if(entry.isDirectory())walk(full);
        else if(/\.(jsx|tsx|js|ts)$/.test(entry.name))pages.push(path.relative(project.path,full).replace(/\\/g,"/"));
      }
    };
    walk(dir);
  }

  const docsMap=read(path.join(project.path,"docs","frontend","COMPONENT_MAP.md"))
    + "\n"+read(path.join(project.path,"docs","frontend","DESIGN_SYSTEM.md"))
    + "\n"+read(path.join(project.path,"docs","frontend","ACCESSIBILITY_AUDIT.md"))
    + "\n"+read(path.join(project.path,"docs","frontend","VISUAL_REGRESSION.md"));

  const coverage:any[]=[];
  const add=(id:string,label:string,status:string,evidence:string[],gaps:string[])=>coverage.push({id,label,status,evidence,gaps});

  for(const rel of ["index.html","public/index.html","app.js"]){
    if(fs.existsSync(path.join(project.path,...rel.split("/"))))pages.push(rel);
  }
  add("frontend-pages","Page / screen surface",
    pages.length>0?"verified":"missing",
    pages.slice(0,8),
    pages.length>0?[]:["No page/HTML/JS surface discovered"]);

  const text=pages.map(p=>read(path.join(project.path,...p.split("/")))).join("\n");
  add("frontend-empty","Empty states",
    /empty state|no .* found|nothing .* yet|empty/i.test(text)?"partial":"unknown",
    [],["Needs systematic per-screen audit"]);
  add("frontend-loading","Loading states",
    /loading|spinner|skeleton|isLoading/i.test(text)?"partial":"unknown",
    [],["Needs systematic per-screen audit"]);
  add("frontend-errors","Error states",
    /error|validation|errors\./i.test(text)?"partial":"unknown",
    [],["Needs systematic per-screen audit"]);
  add("frontend-permissions","Permission-aware UI",
    /can\(|permission|abilities|canUpdate|authorize/i.test(text)?"partial":"unknown",
    [],["Need route/controller/UI permission matrix verification"]);
  add("frontend-responsive","Responsive layout",
    /@media|sm:|md:|lg:|grid-template|responsive/i.test(text)?"partial":"unknown",
    [],["Runtime viewport verification not yet recorded"]);
  add("frontend-accessibility","Accessibility",
    /aria-|role=|tabIndex|htmlFor/i.test(text)?"partial":"unknown",
    docsMap?["docs/frontend/*"]:[],
    ["Need keyboard/focus/contrast audit"]);
  add("frontend-build","Frontend build",
    /npm run build/i.test(read(path.join(project.path,"PROGRESS.md")))?"verified":"unknown",
    ["PROGRESS.md"],["Build evidence may be stale; rerun when frontend changes"]);

  return coverage;
}


function markWorkCommandVerified(projectId:string,workItemId:string){
  const history=readJsonArray(commandHistoryFile);
  let changed=false;
  for(const c of history){
    if(c.projectId===projectId&&c.workItemId===workItemId&&c.status==="completed"&&c.qualityGateStatus==="pending_reaudit"){
      c.qualityGateStatus="verified";changed=true;
    }
  }
  if(changed)fs.writeFileSync(commandHistoryFile,JSON.stringify(history,null,2));
}

function mergeWorkItems(project:Project, raw:WorkItem[], findings:any[], options?:{canonical?:boolean}){
  const ai=path.join(project.path,".ai-kit");
  const ledgerPath=path.join(ai,"office-work-items.json");
  const old=readJsonArray(ledgerPath) as WorkItem[];

  const safeString=(value:any,fallback:string|null|undefined="")=>
    typeof value==="string"?value:(typeof fallback==="string"?fallback:"");
  const normalizeTitle=(item:any)=>{
    const title=safeString(item?.title).trim();
    if(title)return title;
    const description=safeString(item?.description).trim();
    if(description)return description.slice(0,180);
    const id=safeString(item?.id).trim();
    return id||"Untitled work item";
  };
  const normalizeSource=(item:any)=>{
    const source=safeString(item?.source).trim();
    return source||"legacy";
  };
  const keyFor=(item:any)=>`${normalizeSource(item)}|${normalizeTitle(item).toLowerCase()}`;

  const normalizedOld=(Array.isArray(old)?old:[])
    .filter((x:any)=>x&&typeof x==="object")
    .map((x:any)=>({
      ...x,
      id:safeString(x.id,`legacy-${createHash("sha1").update(JSON.stringify(x)).digest("hex").slice(0,12)}`),
      source:normalizeSource(x),
      title:normalizeTitle(x),
      status:safeString(x.status,"todo"),
      createdAt:safeString(x.createdAt,nowIso()),
      updatedAt:safeString(x.updatedAt,nowIso()),
      lastSeenAt:safeString(x.lastSeenAt,nowIso())
    })) as WorkItem[];

  const oldByKey=new Map<string,WorkItem>(
    normalizedOld.map((x:WorkItem)=>[keyFor(x),x])
  );

  const commands=readJsonArray(commandHistoryFile);
  const sourceRows:Array<any>=Array.isArray(raw)?[...raw]:[];

  // Security findings become work items too.
  for(const f of Array.isArray(findings)?findings:[]){
    if(!f||typeof f!=="object"||f.status==="fixed")continue;
    const findingTitle=normalizeTitle(f);
    sourceRows.push({
      id:`FINDING-${safeString(f.id,"unknown")}`,
      projectId:project.id,
      type:typeFromText(findingTitle),
      title:`${safeString(f.id,"FINDING")} ${findingTitle}`.trim(),
      status:f.status==="working"?"working":"todo",
      priority:f.severity==="BLOCKER"?"critical":safeString(f.severity,"medium").toLowerCase(),
      source:"security-audit",
      sourceFile:"docs/security/SECURITY_AUDIT.md",
      assignedRole:f.assignedRole||roleForWork(typeFromText(findingTitle)),
      evidence:["docs/security/SECURITY_AUDIT.md"],
      acceptanceCriteria:[],
      createdAt:f.firstSeenAt||nowIso(),
      updatedAt:f.updatedAt||nowIso(),
      lastSeenAt:nowIso(),
      verificationStatus:"unverified"
    });
  }

  const merged:WorkItem[]=[];
  const seen=new Set<string>();

  for(const rawItem of sourceRows){
    if(!rawItem||typeof rawItem!=="object")continue;

    const item={
      ...rawItem,
      source:normalizeSource(rawItem),
      title:normalizeTitle(rawItem)
    } as WorkItem;

    const key=keyFor(item);
    const previous=oldByKey.get(key);

    let candidate:WorkItem;
    if(previous){
      candidate={
        ...previous,
        ...item,
        id:safeString(item.id,safeString(previous.id)),
        source:normalizeSource(item),
        title:normalizeTitle(item),
        createdAt:safeString(previous.createdAt,safeString(item.createdAt,nowIso())),
        updatedAt:nowIso(),
        lastSeenAt:nowIso()
      } as WorkItem;
    }else{
      candidate={
        ...item,
        id:safeString(item.id,`work-${createHash("sha1").update(key).digest("hex").slice(0,12)}`),
        source:normalizeSource(item),
        title:normalizeTitle(item),
        createdAt:safeString(item.createdAt,nowIso()),
        updatedAt:safeString(item.updatedAt,nowIso()),
        lastSeenAt:safeString(item.lastSeenAt,nowIso())
      } as WorkItem;
    }

    const related=commands
      .filter((c:any)=>c&&c.projectId===project.id)
      .find((c:any)=>{
        const wid=safeString(c.workItemId);
        const fid=safeString(c.findingId);
        return (wid&&wid===safeString(candidate.id)) ||
          (fid&&safeString(candidate.id).includes(fid));
      });

    if(related){
      candidate.commandId=safeString(related.id,candidate.commandId);
      candidate.lastResult=safeString(related.message,candidate.lastResult);
      if(related.status==="completed"){
        candidate.status="done";
        candidate.verificationStatus=related.qualityGateStatus==="verified"?"verified":"pending_reaudit";
      }else if(["running","planning","verifying","waiting_for_agent"].includes(related.status)){
        candidate.status="working";
      }
    }

    const candidateKey=keyFor(candidate);
    if(seen.has(candidateKey))continue;
    seen.add(candidateKey);
    merged.push(candidate);
  }

  // Preserve active legacy rows not regenerated this pass, but only after
  // normalization. Terminal historical rows are intentionally not resurrected.
  for(const previous of normalizedOld){
    const key=keyFor(previous);
    if(seen.has(key))continue;
    if(["done","fixed","cancelled","failed"].includes(String(previous.status)))continue;
    if(options?.canonical&&HARVEST_NOISE_SOURCES.has(String(previous.source))&&!["working","queued"].includes(String(previous.status)))continue;

    merged.push({
      ...previous,
      source:normalizeSource(previous),
      title:normalizeTitle(previous),
      updatedAt:safeString(previous.updatedAt,nowIso()),
      lastSeenAt:safeString(previous.lastSeenAt,nowIso())
    });
    seen.add(key);
  }

  fs.writeFileSync(ledgerPath,JSON.stringify(merged,null,2));
  return merged;
}


function readCanonicalBacklog(project:Project){
  const file=path.join(project.path,".ai-kit","backlog-canonical.json");
  const data=readJson(file);
  if(!data||!Array.isArray(data.openTodos))return null;
  return data;
}

function canonicalWorkItem(project:Project,item:any):WorkItem{
  const title=String(item?.title||item?.id||"Canonical backlog item");
  const assignedRole=String(item?.assignedRole||roleForWork(typeFromText(title),title));
  const type=typeFromText(`${assignedRole} ${title}`);
  return {
    id:String(item?.id||`CANON-${slug(title)}`),
    projectId:project.id,
    type,
    title,
    description:"Canonical backlog source-of-truth item.",
    status:"todo",
    priority:["critical","high","medium","low"].includes(String(item?.priority))?String(item.priority):"medium",
    source:"canonical-backlog",
    sourceFile:".ai-kit/backlog-canonical.json",
    assignedRole,
    evidence:Array.isArray(item?.evidence)?item.evidence.map(String):[],
    acceptanceCriteria:[],
    createdAt:nowIso(),updatedAt:nowIso(),lastSeenAt:nowIso(),verificationStatus:"unverified"
  } as WorkItem;
}

function resolvedHistoricalText(text:string){
  const t=String(text||"").toLowerCase();
  return /\b(fixed|resolved|re-verified|reverified|already remediated|already fixed|closed)\b/.test(t)
    || /not authoritative|stale plan|historical/.test(t);
}

function coverageWorkType(domain:string){
  if(domain==="tests")return "test";
  if(domain==="ai-integrations")return "feature";
  return ["backend","frontend","security","database","docs","devops"].includes(domain)?domain:"feature";
}
function coverageRole(domain:string){
  const map:Record<string,string>={
    backend:"Backend",frontend:"Frontend",security:"Security",tests:"QA",
    database:"Database",docs:"Docs",devops:"DevOps","ai-integrations":"Backend"
  };
  return map[domain]||"Backend";
}

function generateWorkbench(project:Project, findings:any[], coverage?:any, featureState?:any){
  const raw:WorkItem[]=[
    ...harvestProgressTodo(project),
    ...harvestNextActions(project),
    ...harvestCheckboxLines(project,"docs/testing/TEST_GAPS.md","test-gaps","TEST"),
    ...harvestCheckboxLines(project,"docs/testing/TENANT_ISOLATION.md","test-gaps","ISO"),
    ...harvestCheckboxLines(project,"docs/ROADMAP.md","roadmap","ROAD"),
  ];

  const frontendCoverage=scanFrontend(project);
  for(const gap of frontendCoverage){
    if(gap.status==="verified")continue;
    raw.push({
      id:`FE-${gap.id}`,projectId:project.id,type:"frontend",
      title:`Frontend audit: ${gap.label}`,
      description:gap.gaps.join("; "),
      status:"todo",priority:harvestScanPriority(gap.status),
      source:"frontend-audit",sourceFile:null,assignedRole:"Frontend",
      evidence:gap.evidence,acceptanceCriteria:gap.gaps,
      createdAt:nowIso(),updatedAt:nowIso(),lastSeenAt:nowIso(),verificationStatus:"unverified"
    });
  }

  // Coverage checks are actionable work, not just percentages.
  if(coverage?.domains){
    for(const [domain,report] of Object.entries(coverage.domains) as Array<[string,any]>){
      for(const c of report.checks||[]){
        if(!["missing","partial"].includes(c.status))continue;
        const type=coverageWorkType(domain);
        raw.push({
          id:`COV-${domain.toUpperCase()}-${String(c.id).replace(/[^a-zA-Z0-9_-]/g,"-")}`,
          projectId:project.id,type,
          title:`${domain}: ${c.label}`,
          description:(c.gaps||[]).join("; ")||`Improve ${domain} coverage for ${c.label}.`,
          status:"todo",priority:harvestScanPriority(c.status),
          source:"coverage",sourceFile:".ai-kit/project-coverage.json",
          assignedRole:coverageRole(domain),evidence:c.evidence||[],
          acceptanceCriteria:[
            `Coverage check '${c.label}' must no longer be MISSING/PARTIAL after re-audit.`,
            ...(c.gaps||[])
          ],
          createdAt:nowIso(),updatedAt:nowIso(),lastSeenAt:nowIso(),verificationStatus:"unverified"
        });
      }
    }
  }

  // Feature surfaces become concrete work items too, but historical FIXED/
  // resolved audit text must never be turned back into actionable product work.
  for(const contract of featureState?.contracts||[]){
    if(resolvedHistoricalText(`${contract?.name||""} ${contract?.description||""}`))continue;
    for(const s of contract.surface||[]){
      if(!["missing","partial"].includes(s.status))continue;
      if(s.level==="excluded"||s.level==="decision_required")continue;

      const inferredType =
        /test/i.test(s.key)?"test":
        /authorization|security/i.test(s.key)?"security":
        contract.archetype==="dashboard"?"frontend":
        "feature";

      raw.push({
        id:`FC-${contract.id}-${s.key}`,projectId:project.id,type:inferredType,
        title:`${contract.name}: ${s.label}`,
        description:`Feature contract ${contract.archetype} expects ${s.label}.`,
        status:"todo",priority:harvestScanPriority(s.status),
        source:"feature-contract",sourceFile:".ai-kit/feature-contracts.json",
        assignedRole:roleForWork(inferredType,`${contract.name} ${s.label}`),
        evidence:s.evidence||[],acceptanceCriteria:[
          `${s.label} must be VERIFIED by feature coverage re-audit.`,
          ...(s.gaps||[])
        ],
        createdAt:nowIso(),updatedAt:nowIso(),lastSeenAt:nowIso(),verificationStatus:"unverified"
      });
    }
  }

  // Canonical backlog is the source of truth when present. Coverage and
  // feature-contract scans remain informative, but cannot inflate Ready Work.
  const canonical=readCanonicalBacklog(project);
  const actionableRaw=canonical
    ? canonical.openTodos.map((item:any)=>canonicalWorkItem(project,item))
    : raw;

  const workItems=mergeWorkItems(project,actionableRaw,findings,{canonical:Boolean(canonical)})
    .slice()
    .sort((a,b)=>workSortRank(a)-workSortRank(b)||String(a.id).localeCompare(String(b.id)));
  const summary={
    todo:workItems.filter(x=>["todo","queued"].includes(x.status)).length,
    fixing:workItems.filter(x=>x.status==="working").length,
    done:workItems.filter(x=>x.status==="done").length,
    deferred:workItems.filter(x=>x.status==="deferred").length,
    frontendVerified:frontendCoverage.filter((x:any)=>x.status==="verified").length,
    frontendPartial:frontendCoverage.filter((x:any)=>x.status==="partial").length,
    frontendMissing:frontendCoverage.filter((x:any)=>x.status==="missing").length,
    frontendUnknown:frontendCoverage.filter((x:any)=>x.status==="unknown").length
  };
  const result={projectId:project.id,generatedAt:nowIso(),workItems,frontendCoverage,summary};
  fs.writeFileSync(path.join(project.path,".ai-kit","office-workbench.json"),JSON.stringify(result,null,2));
  return result;
}


function isInfrastructureFailure(command:any){
  const msg=String(command?.message||command?.mergeGateSummary||"");
  return /Collaborative\/Competitive execution requires Git|Connection lost|reconnect|ECONN|ETIMEDOUT|ENETUNREACH|network|workspace trust required|CLI unavailable|Project path does not exist|Stopped (?:security|qa|frontend|backend|devops|database|architect) lane after .* failed|blocked by failed dependency|dependency failed|merge blocked|worktree isolation failed/i.test(msg);
}

function generateAgentAnalytics(project:Project){
  const commands=readJsonArray(commandHistoryFile).filter((c:any)=>c.projectId===project.id);
  const grouped=new Map<string,any[]>();

  for(const c of commands){
    const role=String(c.assignedRole||c.executionLane||"Governance");
    const id=normalizedAgentKey(role);
    const arr=grouped.get(id)||[];
    arr.push(c);
    grouped.set(id,arr);
  }

  const rows=[...grouped.entries()].map(([agentId,items])=>{
    const completed=items.filter((x:any)=>x.status==="completed").length;
    const infrastructureBlocked=items.filter((x:any)=>x.status==="failed"&&isInfrastructureFailure(x)).length;
    const failed=items.filter((x:any)=>x.status==="failed"&&!isInfrastructureFailure(x)).length;
    const cancelled=items.filter((x:any)=>x.status==="cancelled").length;
    const active=items.filter((x:any)=>["planning","plan_ready","running","verifying"].includes(x.status)).length;
    const queued=items.filter((x:any)=>["queued","waiting_for_agent"].includes(x.status)).length;

    const durations=items
      .filter((x:any)=>x.startedAt&&x.completedAt)
      .map((x:any)=>(Date.parse(x.completedAt)-Date.parse(x.startedAt))/1000)
      .filter((x:number)=>Number.isFinite(x)&&x>=0);

    return {
      agentId,
      role:String(items[0]?.assignedRole||items[0]?.executionLane||"Governance"),
      assigned:items.length,
      completed,
      failed,
      infrastructureBlocked,
      cancelled,
      active,
      queued,
      successRate:(completed+failed)>0?Math.round(completed/(completed+failed)*100):null,
      avgDurationSeconds:durations.length
        ? Math.round(durations.reduce((a:number,b:number)=>a+b,0)/durations.length)
        : null
    };
  }).sort((a,b)=>b.assigned-a.assigned||a.role.localeCompare(b.role));

  const points:Array<[number,number]>=[];
  for(const c of commands){
    if(c.startedAt)points.push([Date.parse(c.startedAt),1]);
    if(c.completedAt)points.push([Date.parse(c.completedAt),-1]);
  }
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);

  let active=0;
  let parallelPeak=0;
  for(const [,delta] of points){
    active+=delta;
    parallelPeak=Math.max(parallelPeak,active);
  }

  const analytics={
    projectId:project.id,
    generatedAt:new Date().toISOString(),
    rows,
    totalCommands:commands.length,
    totalCompleted:commands.filter((x:any)=>x.status==="completed").length,
    totalFailed:commands.filter((x:any)=>x.status==="failed"&&!isInfrastructureFailure(x)).length,
    totalInfrastructureBlocked:commands.filter((x:any)=>x.status==="failed"&&isInfrastructureFailure(x)).length,
    parallelPeak
  };

  fs.writeFileSync(
    path.join(project.path,".ai-kit","office-agent-analytics.json"),
    JSON.stringify(analytics,null,2)
  );
  return analytics;
}

function syncProject(project: Project) {
  if (!project.enabled || !fs.existsSync(project.path)) return;

  const ai = path.join(project.path, ".ai-kit");
  fs.mkdirSync(ai, { recursive: true });

  const progress = read(path.join(project.path, "PROGRESS.md"));
  const projectState = read(path.join(project.path, "PROJECT_STATE.md"));
  const securityAudit = read(path.join(project.path, "docs", "security", "SECURITY_AUDIT.md"));
  const task = readJson(path.join(ai, "current-task.json"));
  const counts = countProgress(progress);
  const reconciledFindings = reconcileFindings(project, progress, securityAudit);
  // Pass 1 gives frontend evidence needed by coverage.
  const initialWorkbench = generateWorkbench(project, reconciledFindings);
  const featureContracts = generateFeatureContracts(project);
  const heuristicCoverage = generateProjectCoverage(project, featureContracts, reconciledFindings, initialWorkbench.frontendCoverage);
  const agentCoveragePath=path.join(ai,"project-coverage.agent.json");
  const heuristicCoveragePath=path.join(ai,"project-coverage.heuristic.json");
  fs.writeFileSync(heuristicCoveragePath,JSON.stringify(heuristicCoverage,null,2));

  const agentCoverage=readJson(agentCoveragePath);
  const confidenceRank:Record<string,number>={low:1,medium:2,high:3};
  const agentUsable=agentCoverage
    && agentCoverage.projectId===project.id
    && Number.isFinite(Number(agentCoverage.overallScore))
    && agentCoverage.domains
    && confidenceRank[String(agentCoverage.overallConfidence||"low")]>=confidenceRank[String(heuristicCoverage.overallConfidence||"low")];

  const projectCoverage=agentUsable
    ? {
        ...heuristicCoverage,
        ...agentCoverage,
        selectedSource:"coding-agent-evidence",
        heuristicScore:heuristicCoverage.overallScore,
        domains:Object.fromEntries(Object.entries(heuristicCoverage.domains).map(([key,h]:any)=>{
          const a=agentCoverage.domains?.[key]||{};
          return [key,{
            ...h,
            ...a,
            checks:Array.isArray(a.checks)?a.checks:[],
            largestGaps:Array.isArray(a.largestGaps)?a.largestGaps:[]
          }];
        })),
        extras:Array.isArray(agentCoverage.extras)?agentCoverage.extras:heuristicCoverage.extras,
        hasProgressDoc:heuristicCoverage.hasProgressDoc
      }
    : {...heuristicCoverage,selectedSource:"office-heuristic"};

  fs.writeFileSync(path.join(ai,"project-coverage.json"),JSON.stringify(projectCoverage,null,2));

  // Pass 2 converts current coverage/feature gaps into actionable work and
  // reconciles stale items out of Ready Work when their source gap is gone.
  const workbench = generateWorkbench(project, reconciledFindings, projectCoverage, featureContracts);
  generateAgentAnalytics(project);

  const organization=resolveOrganization(project);
  const state = {
    projectId: project.id,
    projectName:
      matchOne(projectState, /## Product \/ Project\s*\n([^\n]+)/i)?.split("—")[0]?.trim()
      || project.name,
    projectPath: project.path,
    milestone:
      task.milestone
      || matchOne(progress, /\*\*Current Milestone:\*\*\s*([^\n]+)/i)
      || matchOne(projectState, /## Current Milestone\s*\n([^\n]+)/i),
    activeTask:
      task.title
      || matchOne(progress, /\*\*Active Task:\*\*\s*([^\n]+)/i)
      || task.next_step
      || null,
    health: health(counts),
    roadmapPercent: (()=>{
      if(reconciledFindings.length){
        const fixed=reconciledFindings.filter((f:any)=>f.status==="fixed").length;
        return Math.round(fixed/reconciledFindings.length*100);
      }
      const total=counts.done+counts.partial+counts.todo;
      if(!total)return 0;
      return Math.round((counts.done+counts.partial*0.5)/total*100);
    })(),
    counts,
    findings: reconciledFindings,
    agents: agents(project, task, reconciledFindings),
    organizationSummary:{
      core:organization.core.length,
      specialists:organization.specialists.length,
      candidates:organization.candidates.length,
      capabilities:organization.detectedCapabilities
    },
    workbenchSummary: workbench.summary,
  };

  const serialized = JSON.stringify(state);
  if (serialized !== lastStates.get(project.id)) {
    fs.writeFileSync(path.join(ai, "office-state.json"), JSON.stringify(state, null, 2));
    lastStates.set(project.id, serialized);
    console.log(`[KIT] ${project.name} changed · ${state.activeTask ?? "no active task"}`);
  }
}

function tick() {
  for (const project of projects()) syncProject(project);
}

tick();
setInterval(tick, 2000);

console.log(`[KIT] multi-project listener active · registry: ${projectsFile}`);
