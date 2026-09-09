import fs from "node:fs";import path from "node:path";
const root=process.cwd(),bridge=fs.readFileSync(path.join(root,"bridge/server.ts"),"utf8"),hook=fs.readFileSync(path.join(root,"src/hooks/useOfficeSocket.ts"),"utf8");
const files:string[]=[];
function walk(d:string){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(e.name!=="node_modules")walk(p);}else if(/\.(ts|tsx)$/.test(e.name))files.push(p);}}
walk(path.join(root,"src"));
const actions=new Set<string>();
for(const file of files){const s=fs.readFileSync(file,"utf8");for(const re of [/\bsend\s*\(\s*\{\s*action\s*:\s*"([^"]+)"/gs,/\bsocket\.send\s*\(\s*JSON\.stringify\s*\(\s*\{\s*action\s*:\s*"([^"]+)"/gs])for(const m of s.matchAll(re))actions.add(m[1]);}
const handlers=new Set([...bridge.matchAll(/m\.action\s*===\s*"([^"]+)"/g)].map(x=>x[1]));
const handledEvents=new Set([...hook.matchAll(/payload\.type\s*===\s*"([^"]+)"/g)].map(x=>x[1]));
const broadcasts=new Set([...bridge.matchAll(/broadcast\s*\(\s*\{\s*type\s*:\s*"([^"]+)"/g)].map(x=>x[1]));
const missing=[...actions].filter(x=>!handlers.has(x)).sort();
const unhandledBroadcasts=[...broadcasts].filter(x=>!handledEvents.has(x)).sort();
console.log(`real client transport actions: ${actions.size}`);
console.log(`bridge handlers: ${handlers.size}`);
console.log(`missing transport handlers: ${missing.length}`);
console.log(`unhandled stateful broadcasts: ${unhandledBroadcasts.length}`);
if(missing.length){for(const x of missing)console.error("missing:",x);process.exitCode=1;}else console.log("client -> bridge transport wiring: PASS");
if(unhandledBroadcasts.length){for(const x of unhandledBroadcasts)console.log("unhandled broadcast:",x);}else console.log("bridge broadcast -> client state wiring: PASS");
