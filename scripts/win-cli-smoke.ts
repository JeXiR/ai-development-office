import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {buildCliLaunch,CLI_PROMPT_INLINE_LIMIT} from "../src/providers/cli-launch";
import {commandLineLength,spawnEnv,unwrapCursorAgentShim,WIN_CMD_LINE_LIMIT,wrapWindowsCli} from "../src/providers/win-cli";
import {keepResolvedExecutable,ProviderResolver} from "../src/providers/resolver";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-win-cli-"));
const long="x".repeat(CLI_PROMPT_INLINE_LIMIT+80);
const launch=buildCliLaunch({
  provider:"cursor",
  executable:"agent.cmd",
  projectPath:temp,
  prompt:long,
  mutating:true,
  trusted:true
});
if(launch.args.some(arg=>arg.length>CLI_PROMPT_INLINE_LIMIT))throw new Error("long factory prompt stayed inline");
if(launch.args.some(arg=>/[\r\n]/.test(arg)))throw new Error("launch args must stay single-line on Windows");
if(/[\r\n]/.test(launch.env.OFFICE_PROMPT||""))throw new Error("OFFICE_PROMPT must stay single-line");
if(!launch.env.OFFICE_PROMPT_FILE||!fs.existsSync(launch.env.OFFICE_PROMPT_FILE))throw new Error("prompt file missing");
if(launch.env.OFFICE_PROMPT_FILE.replace(/\\/g,"/").includes("/.ai-kit/office-prompts/"))throw new Error("prompt file must stay outside the project tree");
if(!launch.args.at(-1)?.includes(path.basename(launch.env.OFFICE_PROMPT_FILE)))throw new Error("cursor launch did not point at prompt file");

const huge=Array.from({length:40},(_,i)=>`arg-${i}-${"y".repeat(300)}`);
const wrapped=wrapWindowsCli(path.join(temp,"agent.cmd"),huge);
if(process.platform==="win32"){
  if(/powershell/i.test(wrapped.command))throw new Error("oversized .cmd must not go through PowerShell");
  const script=wrapped.args.at(-1)||"";
  if(!/\.cmd$/i.test(script)||!fs.existsSync(script))throw new Error("launch .cmd missing");
  if(commandLineLength(wrapped.command,wrapped.args)>WIN_CMD_LINE_LIMIT)throw new Error("wrapper command line still too long");
}

if(process.platform==="win32"){
  const newlineWrap=wrapWindowsCli(process.env.ComSpec||"cmd.exe",["/d","/s","/c","echo line1\nline2"]);
  if(newlineWrap.args.some(arg=>/[\r\n]/.test(arg)))throw new Error("wrapWindowsCli left a newline in argv");
  const probe=spawnSync(newlineWrap.command,newlineWrap.args,{encoding:"utf8",windowsHide:true,timeout:8000,env:spawnEnv()});
  if(probe.error)throw probe.error;
}

if(process.platform==="win32"){
  const agent=path.join(process.env.LOCALAPPDATA||"","cursor-agent","agent.cmd");
  if(fs.existsSync(agent)){
    const runtime=unwrapCursorAgentShim(agent);
    if(!runtime||!/\.exe$/i.test(runtime.command)||!runtime.prefixArgs.some(arg=>/index\.js$/i.test(arg))){
      throw new Error("cursor agent.cmd should unwrap to versioned node.exe + index.js");
    }
    const direct=wrapWindowsCli(agent,["-p","--trust"]);
    if(/powershell|cmd\.exe|agent\.cmd/i.test(direct.command))throw new Error("cursor wrap should launch node.exe, not PowerShell/cmd");
    if(!direct.args.some(arg=>/index\.js$/i.test(arg)))throw new Error("cursor wrap missing index.js");
  }
}

if(!keepResolvedExecutable("cursor","C:\\Users\\me\\.grok\\bin\\agent.exe")){
  // expected
}else{
  throw new Error("cursor must not keep Grok agent.exe");
}
if(keepResolvedExecutable("grok","C:\\Users\\me\\.grok\\bin\\grok.exe")!==true){
  throw new Error("grok must keep its home bin");
}

const resolver=new ProviderResolver();
const cursorExe=resolver.resolveExecutable("cursor");
if(cursorExe&&/\.grok[/\\]bin[/\\]/i.test(cursorExe)){
  throw new Error(`cursor resolved to Grok binary: ${cursorExe}`);
}

console.log("Windows CLI smoke PASS");
