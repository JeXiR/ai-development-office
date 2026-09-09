import fs from "node:fs";
import path from "node:path";

export type KitLocation={
  root:string|null;
  mode:"embedded"|"developer-override"|"missing";
};

export function locateKit(officeRoot:string):KitLocation{
  const embedded=path.resolve(officeRoot,"engine","ai-development-kit");
  if(fs.existsSync(embedded))return {root:embedded,mode:"embedded"};

  const allowOverride=process.env.AI_DEVELOPMENT_KIT_DEV_OVERRIDE==="1";
  const override=(process.env.AI_DEVELOPMENT_KIT_PATH||"").trim();
  if(allowOverride&&override){
    const resolved=path.resolve(override);
    if(fs.existsSync(resolved))return {root:resolved,mode:"developer-override"};
  }

  return {root:null,mode:"missing"};
}

export function locateEmbeddedKit(officeRoot:string){
  return locateKit(officeRoot).root;
}

export function kitLocationCandidates(officeRoot:string){
  return [{
    mode:"embedded",
    path:path.resolve(officeRoot,"engine","ai-development-kit"),
    preferred:true
  },{
    mode:"developer-override",
    path:(process.env.AI_DEVELOPMENT_KIT_PATH||"").trim()||null,
    preferred:false,
    enabled:process.env.AI_DEVELOPMENT_KIT_DEV_OVERRIDE==="1"
  }];
}
