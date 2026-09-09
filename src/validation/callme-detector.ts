import fs from "node:fs";
import path from "node:path";
import {CALLME_PROFILE} from "./callme-profile";

function exists(root:string,rel:string){return fs.existsSync(path.join(root,rel));}
function readJson(file:string){try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return null;}}

export function detectCallMeProject(projectPath:string){
  const composer=readJson(path.join(projectPath,"composer.json"));
  const pkg=readJson(path.join(projectPath,"package.json"));
  const expectedFiles=CALLME_PROFILE.expectedFiles.map(rel=>({rel,present:exists(projectPath,rel)}));

  const laravel=Boolean(composer?.require?.["laravel/framework"]);
  const inertia=Boolean(
    pkg?.dependencies?.["@inertiajs/react"]||
    pkg?.devDependencies?.["@inertiajs/react"]||
    composer?.require?.["inertiajs/inertia-laravel"]
  );
  const react=Boolean(pkg?.dependencies?.react||pkg?.devDependencies?.react);

  return {
    projectPath,
    exists:fs.existsSync(projectPath),
    expectedFiles,
    laravel,
    laravelVersion:composer?.require?.["laravel/framework"]||null,
    inertia,
    react,
    packageManager:exists(projectPath,"pnpm-lock.yaml")?"pnpm":exists(projectPath,"yarn.lock")?"yarn":"npm",
    isCallMeCompatible:fs.existsSync(projectPath)&&expectedFiles.every(x=>x.present)&&laravel&&inertia&&react
  };
}
