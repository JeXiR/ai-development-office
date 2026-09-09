import {runNpmScript} from "./lib/run-npm-script";

const scripts=["beta:gate","callme-validation:smoke","callme-cli:smoke","callme-git-stability:smoke","git-fingerprint:smoke","security-dependency-policy:smoke","desktop-windows-launch:smoke","rc-security:smoke"];
const failed:string[]=[];

for(const script of scripts){
  console.log(`\n[RC1] ${script}`);
  if(!runNpmScript(script).ok)failed.push(script);
}

if(failed.length){
  console.error(`RC1 GATE FAIL (${failed.length}/${scripts.length}): ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`RC1 GATE PASS: ${scripts.length}/${scripts.length}`);
