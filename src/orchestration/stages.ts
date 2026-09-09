export type StageResult={
  stage:"test"|"review";
  ok:boolean;
  summary:string;
  evidence:unknown;
};

export function evaluateAgentResults(results:Array<{ok:boolean;output:unknown;error:string|null}>):StageResult{
  const failed=results.filter(x=>!x.ok);
  if(failed.length){
    return {
      stage:"test",
      ok:false,
      summary:`${failed.length} agent result(s) failed`,
      evidence:failed.map(x=>x.error)
    };
  }
  return {
    stage:"test",
    ok:true,
    summary:"All agent executions returned successful results",
    evidence:{successful:results.length}
  };
}

export function reviewMissionResult(finalResult:any):StageResult{
  const completed=Array.isArray(finalResult?.completedAgents)?finalResult.completedAgents.length:0;
  const failed=Array.isArray(finalResult?.failedAgents)?finalResult.failedAgents.length:0;
  const ok=completed>0&&failed===0;
  return {
    stage:"review",
    ok,
    summary:ok?"Mission result passed review":`Mission review found ${failed} failed agent(s)`,
    evidence:{completed,failed}
  };
}
