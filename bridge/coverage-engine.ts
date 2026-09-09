import fs from "node:fs";
import path from "node:path";

export type Project = { id:string; name:string; path:string; enabled:boolean };

function read(file:string){try{return fs.readFileSync(file,"utf8");}catch{return"";}}
function readJson(file:string,fallback:any={}){try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return fallback;}}
function normalizeId(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"feature";}

function isHistoricalResolvedTitle(title:string){
 const t=title.toLowerCase();
 const resolved=/\b(fixed|resolved|re-verified|reverified|already remediated|already fixed|closed)\b/i.test(title);
 const auditId=/^(?:h|m)\d+\b/i.test(title.trim());
 const staleDecision=/not authoritative|stale plan|historical/i.test(t);
 return (auditId&&resolved)||resolved||staleDecision;
}

const archetypeSurfaces:Record<string,Array<[string,string,string]>>={
 "managed-resource":[["list","List / Index","required"],["create","Create","required"],["view","View / Show","assumed"],["edit","Edit","assumed"],["delete","Delete","assumed"],["validation","Validation","required"],["authorization","Authorization","required"],["tests","Regression tests","required"]],
 "api-resource":[["list","List","assumed"],["create","Create","required"],["view","View / Read","required"],["edit","Update / Edit","assumed"],["delete","Delete / Revoke","assumed"],["validation","Validation","required"],["authorization","Authorization","required"],["contract","Request / response contract","required"],["errors","Error handling","required"],["tests","API tests","required"],["rotation","Rotation","decision_required"],["audit-log","Audit log","decision_required"]],
 "dashboard":[["view","Dashboard view","required"],["filters","Filters","assumed"],["loading","Loading state","required"],["empty","Empty state","required"],["errors","Error state","required"],["responsive","Responsive","required"],["authorization","Authorization","required"],["tests","Interaction tests","required"]],
 "settings-module":[["view","View settings","required"],["edit","Edit settings","required"],["validation","Validation","required"],["authorization","Authorization","required"],["tests","Tests","required"]],
 "read-only-resource":[["list","List","required"],["view","View","required"],["filters","Filters","assumed"],["authorization","Authorization","required"],["empty","Empty state","required"],["tests","Tests","required"]]
};

function archetype(name:string,context:string){
 const t=(name+" "+context).toLowerCase();
 if(/api key|api token|rest api|api resource|endpoint/.test(t))return"api-resource";
 if(/dashboard|analytics|overview/.test(t))return"dashboard";
 if(/setting|configuration|preferences/.test(t))return"settings-module";
 if(/read only|readonly|catalog|directory/.test(t))return"read-only-resource";
 if(/customer|contact|user|invoice|channel|source|resource|management|manage/.test(t))return"managed-resource";
 return"unknown";
}
function discoverFeatures(project:Project){
 const files=["docs/ROADMAP.md","PROGRESS.md","PROJECT_STATE.md","README.md"];
 const map=new Map<string,{name:string,source:string[]}>();
 for(const rel of files){
  const text=read(path.join(project.path,...rel.split("/"))); if(!text)continue;
  for(const line of text.split(/\r?\n/)){
   const m=line.match(/^(?:#{1,4}\s+|[-*]\s+)(.+)$/); if(!m)continue;
   const title=m[1].replace(/\[[ xX]\]/g,"").replace(/\*\*/g,"").replace(/~~/g,"").trim();
   if(title.length<3||title.length>90)continue;
   if(isHistoricalResolvedTitle(title))continue;
   if(!/(api|management|settings|dashboard|contact|customer|user|invoice|channel|knowledge|source|report|billing|auth|webhook|notification|moderation|tenant)/i.test(title))continue;
   const id=normalizeId(title),old=map.get(id);
   map.set(id,{name:title,source:[...new Set([...(old?.source||[]),rel])]});
  }
 }
 return [...map.entries()].map(([id,v])=>({id,...v}));
}
function repoText(project:Project){
 const roots=["routes","app","src","resources/js","tests"]; const chunks:string[]=[];
 const walk=(dir:string,depth=0)=>{
  if(depth>5||!fs.existsSync(dir))return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true}).slice(0,500)){
   if(["node_modules","vendor",".git","storage","dist","build"].includes(e.name))continue;
   const full=path.join(dir,e.name);
   if(e.isDirectory())walk(full,depth+1);
   else if(/\.(php|js|jsx|ts|tsx|md)$/.test(e.name)){
    const txt=read(full);if(txt)chunks.push(`\nFILE:${path.relative(project.path,full).replace(/\\/g,"/")}\n${txt.slice(0,22000)}`);
   }
  }
 };
 for(const r of roots)walk(path.join(project.path,...r.split("/")));
 return chunks.join("\n").slice(0,1200000);
}
function evidence(feature:string,key:string,repo:string){
 const words=feature.split(/\s+/).filter(x=>x.length>2).slice(0,4);
 const f=words.length?new RegExp(words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"i"):null;
 const kp:Record<string,RegExp>={
  list:/\b(index|list|GET)\b/i,create:/\b(create|store|POST)\b/i,view:/\b(show|view|detail|GET)\b/i,
  edit:/\b(edit|update|PUT|PATCH)\b/i,delete:/\b(delete|destroy|DELETE|revoke)\b/i,
  validation:/\b(validate|validation|FormRequest|rules)\b/i,authorization:/\b(authorize|policy|permission|can\(|gate)\b/i,
  tests:/\b(test|it\(|describe\(|phpunit|expect\()\b/i,contract:/\b(request|response|json|resource)\b/i,
  errors:/\b(error|exception|422|403|404)\b/i,rotation:/\b(rotate|rotation)\b/i,"audit-log":/\b(audit|activity log|history)\b/i,
  filters:/\b(filter|search|query)\b/i,loading:/\b(loading|spinner|skeleton|isLoading)\b/i,empty:/\b(empty|no .* found|nothing .* yet)\b/i,
  responsive:/\b(sm:|md:|lg:|@media|responsive)\b/i
 };
 const lines=repo.split(/\n/),out:string[]=[]; const pattern=kp[key]||new RegExp(key,"i");
 for(let i=0;i<lines.length;i++) if((!f||f.test(lines[i]))&&pattern.test(lines[i])){
  const file=lines.slice(0,i+1).reverse().find(x=>x.startsWith("FILE:"));out.push(file?file.slice(5):`line:${i+1}`);if(out.length>=4)break;
 }
 return [...new Set(out)];
}
export function generateFeatureContracts(project:Project){
 const ai=path.join(project.path,".ai-kit");fs.mkdirSync(ai,{recursive:true});
 const decisions=readJson(path.join(ai,"feature-decisions.json"),{}), repo=repoText(project), contracts:any[]=[];
 for(const f of discoverFeatures(project).slice(0,80)){
  const context=f.source.map(rel=>read(path.join(project.path,...rel.split("/")))).join("\n");
  const a=archetype(f.name,context); if(a==="unknown")continue;
  const surface:any[]=[],questions:any[]=[];
  for(const [key,label,defaultLevel] of archetypeSurfaces[a]){
   const answer=decisions?.[f.id]?.[key]; let level=defaultLevel;
   if(answer==="yes"||answer==="required")level="required"; if(answer==="no"||answer==="excluded")level="excluded";
   const ev=evidence(f.name,key,repo);
   let status=ev.length>=2?"verified":ev.length?"partial":"missing";
   if(level==="excluded"||answer==="deferred")status="deferred";
   if(level==="decision_required"&&!answer){
    status="unknown";questions.push({id:`${f.id}:${key}`,featureId:f.id,question:`${f.name}: ${label} gerekli mi?`,options:["yes","no","deferred"],answer:null,status:"open"});
   }
   surface.push({key,label,level,status,evidence:ev,gaps:status==="missing"?[`${label} için repository evidence bulunamadı.`]:status==="partial"?[`${label} için evidence var ama tam doğrulanmadı.`]:status==="unknown"?["Kullanıcı kararı gerekiyor."]:[]});
  }
  contracts.push({id:f.id,name:f.name,archetype:a,source:f.source,confidence:"medium",surface,questions,updatedAt:new Date().toISOString()});
 }
 fs.writeFileSync(path.join(ai,"feature-contracts.json"),JSON.stringify(contracts,null,2));
 const state={projectId:project.id,generatedAt:new Date().toISOString(),contracts,openQuestions:contracts.reduce((n,c)=>n+c.questions.length,0)};
 fs.writeFileSync(path.join(ai,"office-feature-contracts.json"),JSON.stringify(state,null,2)); return state;
}
function score(status:string){return status==="verified"?1:status==="partial"?.5:0;}
function check(id:string,label:string,status:string,evidence:string[]=[],gaps:string[]=[],weight=1){return{id,label,status,weight,evidence,gaps};}
function domain(domain:string,checks:any[]){
 let num=0,den=0,unknown=0,deferred=0;
 for(const c of checks){if(c.status==="deferred"){deferred++;continue;}if(c.status==="unknown"){unknown++;continue;}den+=c.weight;num+=score(c.status)*c.weight;}
 const sc=den?Math.round(num/den*100):0;
 return{domain,score:sc,confidence:unknown===0?"high":unknown<=Math.max(2,Math.floor(checks.length*.25))?"medium":"low",
  verified:checks.filter(c=>c.status==="verified").length,partial:checks.filter(c=>c.status==="partial").length,
  missing:checks.filter(c=>c.status==="missing").length,unknown,deferred,checks,
  largestGaps:checks.filter(c=>["missing","partial","unknown"].includes(c.status)).slice(0,6).map(c=>`${c.label}: ${c.status.toUpperCase()}`)};
}
export function generateProjectCoverage(project:Project,featureState:any,findings:any[],frontend:any[]){
 const progress=read(path.join(project.path,"PROGRESS.md")),state=read(path.join(project.path,"PROJECT_STATE.md")),repo=repoText(project),contracts=featureState.contracts||[];
 const aggregate=(keys:string[])=>{
  const all=contracts.flatMap((c:any)=>c.surface.filter((s:any)=>keys.includes(s.key)&&s.level!=="excluded"));
  if(!all.length)return"unknown"; if(all.every((s:any)=>s.status==="verified"||s.status==="deferred"))return"verified";
  if(all.some((s:any)=>s.status==="missing"))return"partial"; return"partial";
 };
 const high=findings.filter((f:any)=>["BLOCKER","HIGH"].includes(f.severity)&&f.status!=="fixed").length;
 const backend=domain("backend",[
  check("routes","Routes/endpoints",/\b(Route::|router\.|app\.(get|post|put|patch|delete))/.test(repo)?"verified":"unknown",["repo"]),
  check("create","Create/store",aggregate(["create"])),check("view","Read/show",aggregate(["view","list"])),check("edit","Update/edit",aggregate(["edit"])),
  check("delete","Delete/revoke",aggregate(["delete"])),check("validation","Validation",aggregate(["validation"])),check("authz","Authorization",aggregate(["authorization"]))
 ]);
 const frontendChecks=(frontend||[]).map((x:any)=>check(x.id,x.label,x.status,x.evidence||[],x.gaps||[]));
 const frontendDomain=domain("frontend",frontendChecks.length?frontendChecks:[check("surface","Frontend surface","unknown",[],["No frontend audit evidence."])]);
 const security=domain("security",[
  check("findings","Open HIGH/BLOCKER",high===0?"verified":high<=2?"partial":"missing",[],high?[`${high} open HIGH/BLOCKER`]:[],2),
  check("auth","Authentication",/\b(auth|login|sanctum|session)\b/i.test(repo)?"partial":"unknown"),check("authz","Authorization",aggregate(["authorization"])),
  check("validation","Input validation",aggregate(["validation"])),check("sec-tests","Security tests",/forbidden|unauthorized|tenant isolation|security/i.test(repo)?"partial":"unknown")
 ]);
 const tests=domain("tests",[
  check("files","Test files",/\b(TestCase|PHPUnit|describe\(|it\(|test\()/.test(repo)?"verified":"missing"),check("crud","CRUD regression",aggregate(["tests"])),
  check("isolation","Tenant isolation",/tenant isolation|cross-tenant|other tenant/i.test(repo)?"partial":"unknown"),check("last-run","Recent run",/tests?.*(passed|failed)|phpunit|npm test/i.test(progress)?"partial":"unknown")
 ]);
 const database=domain("database",[check("schema","Schema/migrations",/\b(Schema::|migration|CREATE TABLE|prisma)\b/i.test(repo)?"verified":"unknown"),check("relations","Relations",/\b(belongsTo|hasMany|foreign key|relation)\b/i.test(repo)?"partial":"unknown"),check("isolation","Data isolation",/tenant_id|tenant isolation|scoped/i.test(repo)?"partial":"unknown")]);
 const docs=domain("docs",[check("roadmap","Roadmap",read(path.join(project.path,"docs","ROADMAP.md"))?"verified":"missing"),check("progress","Progress",progress?"verified":"missing"),check("state","Project state",state?"verified":"missing"),check("contracts","Feature contracts",contracts.length?"partial":"missing")]);
 const devops=domain("devops",[check("ci","CI",fs.existsSync(path.join(project.path,".github","workflows"))?"verified":"missing"),check("docker","Docker",["Dockerfile","docker-compose.yml","compose.yml"].some(f=>fs.existsSync(path.join(project.path,f)))?"verified":"missing"),check("deploy","Deployment",/deploy|deployment|plesk|nginx|vercel|docker/i.test(progress)?"partial":"unknown")]);
 const ai=domain("ai-integrations",[check("providers","AI/provider integration",/\b(openai|anthropic|claude|gemini|deepseek|llm)\b/i.test(repo)?"partial":"unknown")]);
 const hasRoutes=/\b(Route::|router\.|app\.(get|post|put|patch|delete))\b/.test(repo);
 const hasAuth=/\b(auth|login|sanctum|session)\b/i.test(repo);
 const hasTests=/\b(TestCase|PHPUnit|describe\(|it\(|test\()/.test(repo);
 const hasSchema=/\b(Schema::|migration|CREATE TABLE|prisma)\b/i.test(repo);
 const hasCi=fs.existsSync(path.join(project.path,".github","workflows"));
 const hasDocker=["Dockerfile","docker-compose.yml","compose.yml"].some(f=>fs.existsSync(path.join(project.path,f)));
 const hasHtml=fs.existsSync(path.join(project.path,"index.html"))||fs.existsSync(path.join(project.path,"public","index.html"));
 const pubspec=read(path.join(project.path,"pubspec.yaml"));
 const hasFlutter=/sdk:\s*flutter|\bflutter\s*:/i.test(pubspec);
 backend.applicable=hasRoutes||backend.verified+backend.partial>0;
 frontendDomain.applicable=hasHtml||frontendDomain.verified+frontendDomain.partial>0;
 security.applicable=high>0||hasAuth;
 tests.applicable=hasTests||tests.verified+tests.partial>0;
 database.applicable=hasSchema||database.verified+database.partial>0;
 docs.applicable=Boolean(progress||state);
 devops.applicable=hasCi||hasDocker||devops.verified+devops.partial>0;
 ai.applicable=/\b(openai|anthropic|claude|gemini|deepseek|llm)\b/i.test(repo);
 const extras:any[]=[];
 if(hasFlutter){
  const libDir=fs.existsSync(path.join(project.path,"lib"));
  const dartHits=/\b(Widget|StatelessWidget|StatefulWidget|MaterialApp)\b/.test(repo+read(path.join(project.path,"lib","main.dart")));
  const flutter=domain("flutter",[
   check("pubspec","pubspec.yaml","verified",["pubspec.yaml"]),
   check("lib","lib/",libDir?"verified":"missing",libDir?["lib"]:[],libDir?[]:["No lib/ folder"]),
   check("widgets","Widget tree",dartHits?"partial":libDir?"unknown":"missing")
  ]);
  flutter.applicable=true;
  extras.push(flutter);
 }
 const domains:any={backend,frontend:frontendDomain,security,tests,database,docs,devops,"ai-integrations":ai},weights:any={backend:20,frontend:15,security:25,tests:20,database:10,docs:5,devops:5,"ai-integrations":0};
 let weighted=0,total=0,unknownCount=0;
 for(const [k,w] of Object.entries(weights)){unknownCount+=domains[k].unknown;if((w as number)>0){weighted+=domains[k].score*(w as number);total+=(w as number);}}
 const report={projectId:project.id,generatedAt:new Date().toISOString(),overallScore:total?Math.round(weighted/total):0,overallConfidence:unknownCount===0?"high":unknownCount<=6?"medium":"low",unknownCount,weights,domains,extras,hasProgressDoc:Boolean(progress)};
 fs.writeFileSync(path.join(project.path,".ai-kit","project-coverage.json"),JSON.stringify(report,null,2));return report;
}
