import {PIXEL_PALETTE} from "./palette";
import {SPRITE_SIZE} from "./sprite-blueprint";
import type {PixelAgentState} from "./types";

type Facing="up"|"down"|"left"|"right";

function px(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
}

function hash(text:string){
  let h=2166136261;
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
  return h>>>0;
}

function shirtColor(agentId:string){
  const colors=["#4e78a6","#4d8f7b","#8a65a9","#ad704d","#567ca9","#8b7b48","#4f8796"];
  return colors[hash(agentId)%colors.length];
}

function hairColor(agentId:string){
  const colors=["#2b1d18","#3d2918","#5a3a1c","#1d1a16","#6b4a28","#2a3340"];
  return colors[hash(agentId+"hair")%colors.length];
}

function skinColor(agentId:string){
  const colors=["#f0c19b","#e0b089","#c98b62","#8d5a3c","#f6d3b0"];
  return colors[hash(agentId+"skin")%colors.length];
}

function isExecutive(agentId:string){
  return /ceo|cto|pm|architect|director/.test(agentId.toLowerCase());
}

export function buildAgentFrameCanvas(agentId:string,state:PixelAgentState,facing:Facing,frame:number){
  const canvas=document.createElement("canvas");
  canvas.width=SPRITE_SIZE.width;
  canvas.height=SPRITE_SIZE.height;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Canvas 2D context unavailable.");
  ctx.imageSmoothingEnabled=false;

  const bob=(state==="walking"||state==="working"||state==="typing")?frame%2:0;
  const legShift=state==="walking"?(frame%4<2?1:-1):0;
  const shirt=shirtColor(agentId);
  const hair=hairColor(agentId);
  const skin=skinColor(agentId);
  const exec=isExecutive(agentId);

  // shadow
  px(ctx,6,29,12,2,"rgba(0,0,0,.28)");

  // legs / shoes
  px(ctx,8+legShift,23-bob,3,6,PIXEL_PALETTE.trousers);
  px(ctx,13-legShift,23-bob,3,6,PIXEL_PALETTE.trousers);
  px(ctx,7+legShift,28-bob,4,2,PIXEL_PALETTE.shoe);
  px(ctx,13-legShift,28-bob,4,2,PIXEL_PALETTE.shoe);

  // torso
  px(ctx,7,14-bob,10,10,PIXEL_PALETTE.outline);
  px(ctx,8,15-bob,8,8,shirt);
  px(ctx,8,21-bob,8,2,PIXEL_PALETTE.shirtShadow);

  // arms
  const armY=state==="typing"||state==="working"?18:16;
  px(ctx,5,armY-bob,3,6,PIXEL_PALETTE.outline);
  px(ctx,6,armY+1-bob,2,4,skin);
  px(ctx,16,armY-bob,3,6,PIXEL_PALETTE.outline);
  px(ctx,16,armY+1-bob,2,4,skin);

  // head + hair
  px(ctx,7,5-bob,10,10,PIXEL_PALETTE.outline);
  px(ctx,8,7-bob,8,7,skin);
  px(ctx,8,5-bob,8,4,hair);
  px(ctx,9,4-bob,6,2,hair);
  if(exec){
    px(ctx,7,4-bob,10,2,"#d4b45a");
    px(ctx,8,3-bob,8,2,"#f1d27a");
  }

  if(facing!=="up"){
    const eyeY=10-bob;
    if(facing==="left"){
      px(ctx,9,eyeY,1,1,PIXEL_PALETTE.outline);
    }else if(facing==="right"){
      px(ctx,14,eyeY,1,1,PIXEL_PALETTE.outline);
    }else{
      px(ctx,10,eyeY,1,1,PIXEL_PALETTE.outline);
      px(ctx,13,eyeY,1,1,PIXEL_PALETTE.outline);
    }
  }

  // state-specific original pixel detail
  if(state==="thinking"){
    px(ctx,17,4-bob,2,2,"#b69ce2");
    px(ctx,20,2-bob,2,2,"#d4c3ee");
  }else if(state==="blocked"){
    px(ctx,18,5-bob,2,2,PIXEL_PALETTE.blocked);
    px(ctx,20,3-bob,1,1,PIXEL_PALETTE.blocked);
  }else if(state==="done"){
    px(ctx,18,5-bob,1,3,PIXEL_PALETTE.done);
    px(ctx,19,7-bob,3,1,PIXEL_PALETTE.done);
  }else if(state==="testing"){
    px(ctx,4,13-bob,2,4,PIXEL_PALETTE.testing);
  }else if(state==="talking"){
    px(ctx,11,13-bob,2,1,PIXEL_PALETTE.outline);
  }else if(state==="typing"||state==="working"){
    px(ctx,4,22-bob,16,2,"#1b2b3d");
    px(ctx,6,21-bob,12,1,PIXEL_PALETTE.monitorGlow);
  }

  return canvas;
}
