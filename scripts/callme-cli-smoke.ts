import fs from "node:fs";
import path from "node:path";
const file=path.join(process.cwd(),"scripts","callme-validate.ts");
const text=fs.readFileSync(file,"utf8");
if(/^const\s+result\s*=\s*await\s+/m.test(text))throw new Error("Top-level await regression detected in callme-validate.ts");
if(!text.includes("async function main()"))throw new Error("CallMe CLI async main wrapper missing");
if(!text.includes("main().catch("))throw new Error("CallMe CLI error boundary missing");
console.log("CallMe CLI smoke PASS");
