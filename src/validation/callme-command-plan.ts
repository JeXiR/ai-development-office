import fs from "node:fs";
import path from "node:path";

export type ValidationCommand={
  id:string;
  command:string;
  timeoutMs:number;
  required:boolean;
  purpose:string;
};

export function callMeValidationCommands(projectPath:string):ValidationCommand[]{
  const commands:ValidationCommand[]=[];

  commands.push({
    id:"php.version",
    command:"php -v",
    timeoutMs:30000,
    required:true,
    purpose:"Verify PHP runtime"
  });

  commands.push({
    id:"laravel.about",
    command:"php artisan about",
    timeoutMs:60000,
    required:true,
    purpose:"Verify Laravel application boot"
  });

  commands.push({
    id:"laravel.test",
    command:"php artisan test",
    timeoutMs:600000,
    required:true,
    purpose:"Run Laravel test suite"
  });

  const pkgFile=path.join(projectPath,"package.json");
  if(fs.existsSync(pkgFile)){
    try{
      const pkg=JSON.parse(fs.readFileSync(pkgFile,"utf8"));
      if(pkg?.scripts?.typecheck){
        commands.push({
          id:"frontend.typecheck",
          command:"npm run typecheck",
          timeoutMs:300000,
          required:true,
          purpose:"Run frontend TypeScript check"
        });
      }
      if(pkg?.scripts?.build){
        commands.push({
          id:"frontend.build",
          command:"npm run build",
          timeoutMs:600000,
          required:true,
          purpose:"Run production frontend build"
        });
      }
    }catch{}
  }

  return commands;
}
