export type TestResult={
  name:string;
  ok:boolean;
  durationMs:number;
  error:string|null;
};

export async function runCase(name:string,fn:()=>void|Promise<void>):Promise<TestResult>{
  const started=Date.now();
  try{
    await fn();
    return {name,ok:true,durationMs:Date.now()-started,error:null};
  }catch(error){
    return {
      name,
      ok:false,
      durationMs:Date.now()-started,
      error:error instanceof Error?error.stack||error.message:String(error)
    };
  }
}

export function printResults(results:TestResult[]){
  for(const r of results){
    console.log(`${r.ok?"PASS":"FAIL"} ${r.name} (${r.durationMs}ms)`);
    if(r.error)console.error(r.error);
  }
  const failed=results.filter(x=>!x.ok);
  console.log(`\n${results.length-failed.length}/${results.length} passed`);
  if(failed.length)process.exitCode=1;
}
