import type {KitCapability} from "./types";
import type {ProjectDiscovery} from "./project-discovery";

const aliases:Record<string,string[]>={
  laravel:["laravel","php","backend"],
  react:["react","frontend","typescript","javascript"],
  nextjs:["next","nextjs","react","frontend"],
  nestjs:["nestjs","nest","backend","typescript"],
  expo:["expo","react-native","mobile"],
  flutter:["flutter","dart","mobile"],
  postgresql:["postgres","postgresql","database"],
  mysql:["mysql","database"],
  redis:["redis","cache","queue"],
  prisma:["prisma","database","orm"],
  docker:["docker","devops","deployment"],
  "docker-compose":["docker","devops","deployment"],
  "github-actions":["ci","ci-cd","github-actions","devops"]
};

export function resolveProjectCapabilities(discovery:ProjectDiscovery,capabilities:KitCapability[]){
  const terms=new Set<string>([
    ...discovery.stacks,
    ...discovery.frameworks,
    ...discovery.databases,
    ...discovery.infra,
    "architecture","testing","security","git"
  ].map(x=>x.toLowerCase()));

  for(const term of [...terms]){
    for(const alias of aliases[term]||[])terms.add(alias.toLowerCase());
  }

  const scored=capabilities.map(cap=>{
    const hay=[cap.id,cap.title,cap.category,...cap.tags].join(" ").toLowerCase();
    let score=0;
    for(const term of terms)if(hay.includes(term))score++;
    return {id:cap.id,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));

  return scored.map(x=>x.id);
}
