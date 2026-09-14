import {parseCliUsage,resolveCliUsage} from "../src/factory/cli-usage";
import {buildCliLaunch} from "../src/providers/cli-launch";

const json=parseCliUsage('{"usage":{"input_tokens":120,"output_tokens":80,"total_tokens":200,"cost_usd":0.01}}');
if(!json||json.tokens!==200||json.source!=="provider")throw new Error("json usage parse failed");

const jsonl=parseCliUsage('ready\n{"type":"turn","usage":{"input_tokens":10,"output_tokens":5,"total_tokens":15}}\n');
if(!jsonl||jsonl.tokens!==15)throw new Error("jsonl usage parse failed");

const missing=parseCliUsage("plain text with no usage");
if(missing)throw new Error("plain text should not invent provider tokens");

const resolved=resolveCliUsage("no usage", 40, 0.1);
if(resolved.source!=="estimate"||resolved.tokens!==40)throw new Error("estimate fallback failed");

const kimi=buildCliLaunch({provider:"kimi",executable:"kimi",projectPath:"D:/p",prompt:"do it",mutating:true,trusted:true});
if(!kimi.args.includes("-p")||!kimi.args.includes("--yolo"))throw new Error("kimi exec flags missing");

const crush=buildCliLaunch({provider:"crush",executable:"crush",projectPath:"D:/p",prompt:"fix",mutating:true,trusted:true});
if(crush.args[0]!=="run"||!crush.args.includes("--yolo"))throw new Error("crush exec flags missing");

const qwen=buildCliLaunch({provider:"qwen",executable:"qwen",projectPath:"D:/p",prompt:"x",mutating:false,mode:"interactive"});
if(qwen.args.includes("-p"))throw new Error("interactive qwen should not print");

const grok=buildCliLaunch({provider:"grok",executable:"grok",projectPath:"D:/p",prompt:"status only",mutating:false});
if(grok.args[0]!=="-p"||grok.args[1]!=="status only")throw new Error("grok adapter missing");

console.log("CLI usage smoke PASS");
