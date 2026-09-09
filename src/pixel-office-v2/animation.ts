import type {PixelAgentState} from "./types";
import {animationFrameCount,animationFps} from "./sprite-blueprint";

export function normalizedPixelState(input:string):PixelAgentState{
  const value=input.toLowerCase();
  if(["moving","walking"].includes(value))return "walking";
  if(["planning","thinking"].includes(value))return "thinking";
  if(["working","running"].includes(value))return "working";
  if(["typing","editing"].includes(value))return "typing";
  if(["testing","qa"].includes(value))return "testing";
  if(["talking","communicating"].includes(value))return "talking";
  if(["blocked","failed","error"].includes(value))return "blocked";
  if(["done","completed","success"].includes(value))return "done";
  return "idle";
}

export function animationFrameAt(state:PixelAgentState,elapsedMs:number){
  const frames=animationFrameCount(state);
  const fps=animationFps(state);
  return Math.floor(elapsedMs/(1000/fps))%frames;
}
