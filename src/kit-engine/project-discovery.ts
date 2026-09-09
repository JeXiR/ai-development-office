import fs from "node:fs";
import path from "node:path";
import {readJsonSafe} from "./fs-utils";

export type ProjectDiscovery={
  projectPath:string;
  stacks:string[];
  packageManagers:string[];
  frameworks:string[];
  databases:string[];
  infra:string[];
  evidence:string[];
};

export function discoverProjectStack(projectPath:string):ProjectDiscovery{
  const stacks=new Set<string>(), packageManagers=new Set<string>(), frameworks=new Set<string>(), databases=new Set<string>(), infra=new Set<string>(), evidence:string[]=[];

  const exists=(rel:string)=>fs.existsSync(path.join(projectPath,rel));
  const pkg=readJsonSafe<any>(path.join(projectPath,"package.json"));
  const deps={...(pkg?.dependencies||{}),...(pkg?.devDependencies||{})};

  if(pkg){
    stacks.add("node");
    evidence.push("package.json");
    if(deps.next)frameworks.add("nextjs");
    if(deps.react)frameworks.add("react");
    if(deps["@nestjs/core"])frameworks.add("nestjs");
    if(deps.expo)frameworks.add("expo");
    if(deps.prisma||deps["@prisma/client"])databases.add("prisma");
  }

  if(exists("composer.json")){
    stacks.add("php");
    evidence.push("composer.json");
    const composer=readJsonSafe<any>(path.join(projectPath,"composer.json"));
    const req={...(composer?.require||{}),...(composer?.["require-dev"]||{})};
    if(req["laravel/framework"])frameworks.add("laravel");
  }

  if(exists("pubspec.yaml")){stacks.add("dart");frameworks.add("flutter");evidence.push("pubspec.yaml");}
  if(exists("requirements.txt")||exists("pyproject.toml")){stacks.add("python");evidence.push(exists("pyproject.toml")?"pyproject.toml":"requirements.txt");}

  if(exists("pnpm-lock.yaml"))packageManagers.add("pnpm");
  if(exists("yarn.lock"))packageManagers.add("yarn");
  if(exists("package-lock.json"))packageManagers.add("npm");
  if(exists("bun.lockb")||exists("bun.lock"))packageManagers.add("bun");

  if(exists("prisma/schema.prisma")){databases.add("prisma");evidence.push("prisma/schema.prisma");}
  if(exists("docker-compose.yml")||exists("docker-compose.yaml")||exists("compose.yml")||exists("compose.yaml")){infra.add("docker-compose");evidence.push("docker compose");}
  if(exists("Dockerfile")){infra.add("docker");evidence.push("Dockerfile");}
  if(exists(".github/workflows"))infra.add("github-actions");

  // conservative text-based DB detection
  const envExample=[".env.example",".env.sample"].map(x=>path.join(projectPath,x)).find(fs.existsSync);
  if(envExample){
    try{
      const txt=fs.readFileSync(envExample,"utf8").toLowerCase();
      if(txt.includes("postgres"))databases.add("postgresql");
      if(txt.includes("mysql"))databases.add("mysql");
      if(txt.includes("redis"))databases.add("redis");
    }catch{}
  }

  return {
    projectPath:path.resolve(projectPath),
    stacks:[...stacks],
    packageManagers:[...packageManagers],
    frameworks:[...frameworks],
    databases:[...databases],
    infra:[...infra],
    evidence
  };
}
