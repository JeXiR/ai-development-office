import type {Point} from "./pathfinding";
import {findPixelPath} from "./pathfinding";

export type MovementState={
  position:Point;
  target:Point;
  path:Point[];
  segmentIndex:number;
  speed:number;
  moving:boolean;
  facing:"up"|"down"|"left"|"right";
};

export function createMovement(position:Point,target=position):MovementState{
  const path=findPixelPath(position,target);
  return {position:{...position},target:{...target},path,segmentIndex:1,speed:90,moving:path.length>1,facing:"down"};
}

export function retargetMovement(state:MovementState,target:Point){
  state.target={...target};
  state.path=findPixelPath(state.position,target);
  state.segmentIndex=1;
  state.moving=state.path.length>1;
}

export function updateMovement(state:MovementState,dtSeconds:number){
  if(!state.moving||state.segmentIndex>=state.path.length){state.moving=false;return state;}
  let remaining=Math.max(0,dtSeconds)*state.speed;

  while(remaining>0&&state.segmentIndex<state.path.length){
    const target=state.path[state.segmentIndex];
    const dx=target.x-state.position.x;
    const dy=target.y-state.position.y;
    const dist=Math.hypot(dx,dy);

    if(Math.abs(dx)>Math.abs(dy))state.facing=dx>=0?"right":"left";
    else if(Math.abs(dy)>0)state.facing=dy>=0?"down":"up";

    if(dist<=remaining||dist<.001){
      state.position={...target};
      remaining-=dist;
      state.segmentIndex++;
    }else{
      const r=remaining/dist;
      state.position={x:state.position.x+dx*r,y:state.position.y+dy*r};
      remaining=0;
    }
  }

  if(state.segmentIndex>=state.path.length){
    state.position={...state.target};
    state.moving=false;
  }
  return state;
}
