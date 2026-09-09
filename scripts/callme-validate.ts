import path from "node:path";
import {runCallMeValidation} from "../src/validation/callme-runner";

async function main(){
  const projectPath=path.resolve(
    process.argv[2]||
    process.env.OFFICE_PROJECT_PATH||
    "D:\\laragon\\www\\callme"
  );

  const result=await runCallMeValidation(projectPath);
  console.log(JSON.stringify(result,null,2));

  if(!result.passed){
    const failedCommands=result.commands.filter(x=>x.required&&!x.ok).map(x=>x.id);
    const trackedStable=
      result.git.headBefore===result.git.headAfter&&
      result.git.trackedFingerprintBefore===result.git.trackedFingerprintAfter;

    console.error("CALLME VALIDATION FAIL");
    console.error(JSON.stringify({
      readiness:result.readiness.ready,
      failedCommands,
      trackedGitStable:trackedStable,
      untrackedStatusChanged:result.git.untrackedStatusChanged
    },null,2));
    process.exitCode=1;
    return;
  }

  console.log("CALLME VALIDATION PASS");
  if(result.git.untrackedStatusChanged){
    console.log("NOTE: untracked runtime/test artifacts changed during validation; tracked project state remained stable.");
  }
}

main().catch(error=>{
  console.error(error instanceof Error?error.stack||error.message:String(error));
  process.exitCode=1;
});
