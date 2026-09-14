import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {claimLease,leaseConflicts,listLeases,pathsOverlap,releaseLease,renewLease,sweepOrphanLeases} from "../src/coordination/leases";
import {evaluateReceipt,parseVerifyVerdict,receiptFor,writeReceipt} from "../src/factory/verify-receipt";
import {buildConsultPrompt} from "../src/providers/cross-cli";
import {buildCliLaunch} from "../src/providers/cli-launch";
import {officeMcpConfig,providerFromAskTool} from "../src/providers/office-mcp";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-coord-"));

const first=claimLease(temp,{taskId:"PROG-1",agentId:"backend",files:["app/Http/Controllers/AuthController.php"],note:"auth"});
if(!first.ok||!first.lease)throw new Error("first lease failed");

const clash=claimLease(temp,{taskId:"PROG-2",agentId:"frontend",files:["app/Http/Controllers/AuthController.php"]});
if(clash.ok)throw new Error("overlapping lease should fail");
if(!leaseConflicts(temp,"frontend",["app/Http/Controllers/AuthController.php"]).length)throw new Error("conflict list empty");

if(!pathsOverlap("app/Http/Auth.php","app/Http/Auth.php/extra")&&!pathsOverlap("app/Http","app/Http/Auth.php"))throw new Error("prefix overlap failed");
if(pathsOverlap("task:a","task:b"))throw new Error("task ids should not prefix-match");

renewLease(temp,"backend","PROG-1");
sweepOrphanLeases(temp,["PROG-1"]);
if(!listLeases(temp).some(x=>x.taskId==="PROG-1"))throw new Error("live lease swept");
sweepOrphanLeases(temp,[]);
if(listLeases(temp).length)throw new Error("orphan lease remained");

releaseLease(temp,"backend","PROG-1");
if(listLeases(temp).length)throw new Error("lease not released");

const self=writeReceipt(temp,{
  itemId:"PROG-1",
  implementer:"backend",
  verifier:"backend",
  ok:true,
  command:"self",
  exitCode:0,
  evidence:"looks good",
  createdAt:new Date().toISOString()
});
if(evaluateReceipt(self,"backend").ok)throw new Error("self-verify must be rejected");

writeReceipt(temp,{
  itemId:"PROG-1",
  implementer:"backend",
  verifier:"qa",
  ok:true,
  command:"gemini -p",
  exitCode:0,
  evidence:"PHPUnit 12 passed\nVERDICT: PASS",
  createdAt:new Date().toISOString()
});
if(!evaluateReceipt(receiptFor(temp,"PROG-1"),"backend").ok)throw new Error("independent receipt should pass");

if(parseVerifyVerdict("notes only")!=="unknown")throw new Error("unknown verdict");
if(parseVerifyVerdict("VERDICT: FAIL")!=="fail")throw new Error("fail verdict");
if(providerFromAskTool("ask_codex")!=="codex")throw new Error("ask tool map failed");
if(providerFromAskTool("ask_grok")!=="grok")throw new Error("ask_grok map failed");
if(!officeMcpConfig(process.cwd(),temp).args.some(x=>/office-mcp/.test(x)))throw new Error("mcp config missing script");
if(!/VERDICT: PASS/.test(buildConsultPrompt("check auth")))throw new Error("consult prompt missing verdict rule");
const consult=buildCliLaunch({provider:"gemini",executable:"gemini",projectPath:temp,prompt:"check",mutating:false,trusted:false});
if(consult.args.includes("--yolo"))throw new Error("consult must not yolo");

console.log("Coordination smoke PASS");
