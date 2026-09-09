import path from "node:path";
import {EmbeddedKitEngineService} from "../src/kit-engine/service";

export function createKitEngine(){
  return new EmbeddedKitEngineService(process.cwd());
}

export async function getKitEngineSnapshot(){
  return createKitEngine().detect();
}

export async function getProjectKitResolution(projectPath:string){
  const engine=createKitEngine();
  const discovery=await engine.discoverProject(projectPath);
  const resolvedCapabilities=await engine.resolveCapabilities(projectPath);
  return {discovery,resolvedCapabilities};
}

export async function validateKitEngine(){
  return createKitEngine().validate();
}
