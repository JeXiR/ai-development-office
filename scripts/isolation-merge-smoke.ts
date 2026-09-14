import {isEmptyCodingSkip,isProviderAuthFailure,keepLeadOnOverlap,MIN_PLAN_CHARS,shouldRetryShortPlan} from "../src/factory/isolation-merge";

if(MIN_PLAN_CHARS!==120)throw new Error("short-plan threshold drifted");
if(!shouldRetryShortPlan(40,false))throw new Error("first short plan must retry");
if(shouldRetryShortPlan(40,true))throw new Error("second short plan must not retry");
if(shouldRetryShortPlan(200,false))throw new Error("long plan must not retry");

if(!isProviderAuthFailure("oauth session expired"))throw new Error("oauth text must be auth failure");
if(!isProviderAuthFailure("ERROR · drift not_checked"))throw new Error("verifier error phrasing must be auth failure");
if(!isProviderAuthFailure(JSON.stringify({is_error:true,duration_api_ms:800})))throw new Error("fast Claude is_error must be auth failure");
if(isProviderAuthFailure(JSON.stringify({is_error:true,duration_api_ms:8000})))throw new Error("slow Claude is_error is not auto-auth");

const emptyCollab={label:"coding-Laravel Specialist-cursor",ok:false,output:JSON.stringify({is_error:true,duration_api_ms:400}),files:[],patch:""};
if(!isEmptyCodingSkip(emptyCollab,"lead-cursor"))throw new Error("auth-empty collaborator must skip");
if(isEmptyCodingSkip({...emptyCollab,label:"lead-cursor"},"lead-cursor"))throw new Error("lead auth failure must not skip");

const kept=keepLeadOnOverlap([
  {label:"lead-cursor",role:"Architect",files:["app/Http/Controllers/PortfolioController.php","PROGRESS.md"]},
  {label:"coding-Laravel Specialist-cursor",role:"Laravel Specialist",files:["app/Http/Controllers/PortfolioController.php","routes/web.php"]}
],"lead-cursor");
if(!kept.keptLead||kept.blocked)throw new Error("overlap must keep the lead");
if(kept.mergeable[0]?.label!=="lead-cursor")throw new Error("lead candidate missing after overlap");
if(kept.dropped.length!==1)throw new Error("collaborator must be dropped on overlap");
if(!/Overlap on 1 file/.test(kept.summary))throw new Error(`keep-lead summary drifted: ${kept.summary}`);

const blocked=keepLeadOnOverlap([
  {label:"coding-a",role:"A",files:["src/a.ts"]},
  {label:"coding-b",role:"B",files:["src/a.ts"]}
],"lead-cursor");
if(!blocked.blocked||blocked.keptLead)throw new Error("overlap without a lead must block");

const clean=keepLeadOnOverlap([
  {label:"lead-cursor",role:"Architect",files:["a.ts"]},
  {label:"coding-b",role:"B",files:["b.ts"]}
],"lead-cursor");
if(clean.keptLead||clean.blocked||clean.mergeable.length!==2)throw new Error("non-overlapping candidates must all stay");

console.log("Isolation merge smoke PASS");
