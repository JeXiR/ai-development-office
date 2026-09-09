import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {detectCallMeProject} from "../src/validation/callme-detector";
import {callMeValidationCommands} from "../src/validation/callme-command-plan";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-callme-"));
try{
  fs.writeFileSync(path.join(dir,"artisan"),"");
  fs.writeFileSync(path.join(dir,"composer.json"),JSON.stringify({
    require:{
      "laravel/framework":"^13.0",
      "inertiajs/inertia-laravel":"^2.0"
    }
  }));
  fs.writeFileSync(path.join(dir,"package.json"),JSON.stringify({
    dependencies:{
      "@inertiajs/react":"^2.0.0",
      "react":"^19.0.0"
    },
    scripts:{
      typecheck:"tsc --noEmit",
      build:"vite build"
    }
  }));

  const detected=detectCallMeProject(dir);
  if(!detected.isCallMeCompatible)throw new Error("CallMe compatible stack detection failed");
  if(!detected.laravelVersion?.includes("13"))throw new Error("Laravel version detection failed");

  const commands=callMeValidationCommands(dir);
  for(const id of ["php.version","laravel.about","laravel.test","frontend.typecheck","frontend.build"]){
    if(!commands.find(x=>x.id===id))throw new Error(`Missing validation command: ${id}`);
  }

  console.log("CallMe Validation smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
