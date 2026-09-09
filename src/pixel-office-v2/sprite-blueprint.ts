import type {PixelAgentState} from "./types";

export type PixelSpriteFrame={
  state:PixelAgentState;
  frame:number;
  facing:"up"|"down"|"left"|"right";
  width:number;
  height:number;
};

export const SPRITE_SIZE={width:24,height:32,scale:3};

export const ANIMATION_FRAMES:Record<PixelAgentState,number>={
  idle:2,
  thinking:2,
  walking:4,
  working:2,
  typing:2,
  testing:2,
  talking:2,
  blocked:2,
  done:2
};

export function spriteFrameKey(frame:PixelSpriteFrame){
  return `${frame.state}:${frame.facing}:${frame.frame}`;
}

export function animationFrameCount(state:PixelAgentState){
  return ANIMATION_FRAMES[state]||2;
}

export function animationFps(state:PixelAgentState){
  if(state==="walking")return 8;
  if(state==="typing"||state==="working"||state==="testing")return 4;
  return 2;
}
