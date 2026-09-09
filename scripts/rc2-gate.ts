import {runNpmScript} from "./lib/run-npm-script";

const scripts=["rc1:gate","version-consistency:smoke","stable-promotion:smoke","release-integrity"];
const failed:string[]=[];

for(const script of scripts){
  console.log(`\n[RC2] ${script}`);
  if(!runNpmScript(script).ok)failed.push(script);
}

if(failed.length){
  console.error(`RC2 GATE FAIL (${failed.length}/${scripts.length}): ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`RC2 GATE PASS: ${scripts.length}/${scripts.length}`);
