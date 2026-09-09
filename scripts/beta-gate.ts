import {runNpmScript} from "./lib/run-npm-script";

const scripts=[
  "provider-credentials:smoke",
  "autonomous-provider:smoke",
  "provider-routing:smoke",
  "account-connections:smoke",
  "autonomous-execution:smoke",
  "provider-quality:smoke",
  "execution-hardening:smoke",
  "adaptive-routing:smoke",
  "evidence-replay:smoke",
  "mission-runner:smoke",
  "project-docs:smoke",
  "real-project-execution:smoke",
  "pixel-office-v2:smoke",
  "pixel-office-v2-movement:smoke",
  "desktop:smoke",
  "ui-copy:audit",
  "final-four:smoke",
  "runtime-stability:smoke",
  "unified-integration:smoke"
];

const failed:string[]=[];
for(const script of scripts){
  console.log(`\n[BETA] ${script}`);
  if(!runNpmScript(script).ok)failed.push(script);
}
if(failed.length){
  console.error(`BETA GATE FAIL (${failed.length}/${scripts.length}): ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`BETA GATE PASS: ${scripts.length}/${scripts.length}`);
