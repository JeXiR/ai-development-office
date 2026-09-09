import {PIXEL_OFFICE_WORLD,PIXEL_STATIONS} from "./layout";

export type Point={x:number;y:number};

const GRID=16;

function key(x:number,y:number){return `${x},${y}`;}

function blockedCells(){
  const blocked=new Set<string>();
  for(const station of PIXEL_STATIONS){
    // Walls only — room interiors stay walkable so agents can sit at desks.
    const left=Math.floor(station.x/GRID);
    const right=Math.ceil((station.x+station.width)/GRID);
    const top=Math.floor(station.y/GRID);
    const bottom=Math.ceil((station.y+station.height)/GRID);
    const doorX=Math.floor((station.x+station.width/2)/GRID);
    for(let gx=left;gx<=right;gx++){
      blocked.add(key(gx,top));
      blocked.add(key(gx,bottom));
    }
    for(let gy=top;gy<=bottom;gy++){
      blocked.add(key(left,gy));
      blocked.add(key(right,gy));
    }
    blocked.delete(key(doorX,bottom));
    blocked.delete(key(doorX-1,bottom));
    blocked.delete(key(doorX+1,bottom));
  }
  return blocked;
}

const STATIC_BLOCKED=blockedCells();

function cell(p:Point){
  return {x:Math.max(1,Math.min(Math.floor(PIXEL_OFFICE_WORLD.width/GRID)-2,Math.round(p.x/GRID))),
          y:Math.max(1,Math.min(Math.floor(PIXEL_OFFICE_WORLD.height/GRID)-2,Math.round(p.y/GRID)))};
}

function point(c:{x:number;y:number}):Point{
  return {x:c.x*GRID,y:c.y*GRID};
}

function nearestWalkable(start:{x:number;y:number}){
  if(!STATIC_BLOCKED.has(key(start.x,start.y)))return start;
  for(let radius=1;radius<8;radius++){
    for(let dy=-radius;dy<=radius;dy++){
      for(let dx=-radius;dx<=radius;dx++){
        const c={x:start.x+dx,y:start.y+dy};
        if(c.x<1||c.y<1)continue;
        if(c.x>=PIXEL_OFFICE_WORLD.width/GRID-1||c.y>=PIXEL_OFFICE_WORLD.height/GRID-1)continue;
        if(!STATIC_BLOCKED.has(key(c.x,c.y)))return c;
      }
    }
  }
  return start;
}

export function findPixelPath(from:Point,to:Point):Point[]{
  const start=nearestWalkable(cell(from));
  const goal=nearestWalkable(cell(to));
  const q=[start];
  const came=new Map<string,{x:number;y:number}|null>();
  came.set(key(start.x,start.y),null);

  const dirs=[[1,0],[-1,0],[0,1],[0,-1]] as const;
  while(q.length){
    const current=q.shift()!;
    if(current.x===goal.x&&current.y===goal.y)break;
    for(const [dx,dy] of dirs){
      const next={x:current.x+dx,y:current.y+dy};
      if(next.x<1||next.y<1||next.x>=PIXEL_OFFICE_WORLD.width/GRID-1||next.y>=PIXEL_OFFICE_WORLD.height/GRID-1)continue;
      const k=key(next.x,next.y);
      if(STATIC_BLOCKED.has(k)||came.has(k))continue;
      came.set(k,current);
      q.push(next);
    }
  }

  const goalKey=key(goal.x,goal.y);
  if(!came.has(goalKey)){
    // Never return a one-point "path": movement consumers need an origin + destination.
    // Use the outer left corridor as a conservative fallback because station geometry
    // begins well inside the world boundary.
    const startPoint=point(start);
    const goalPoint=point(goal);
    const corridorX=GRID*2;
    const fallback:Point[]=[
      {...from},
      startPoint,
      {x:corridorX,y:startPoint.y},
      {x:corridorX,y:goalPoint.y},
      goalPoint,
      {...to}
    ];
    const deduped:Point[]=[];
    for(const p of fallback){
      const last=deduped[deduped.length-1];
      if(!last||last.x!==p.x||last.y!==p.y)deduped.push(p);
    }
    return deduped;
  }

  const cells:any[]=[];
  let cursor:{x:number;y:number}|null=goal;
  while(cursor){
    cells.push(cursor);
    cursor=came.get(key(cursor.x,cursor.y))||null;
  }
  cells.reverse();

  // simplify straight segments
  const points=cells.map(point);
  if(points.length&& (points[0].x!==from.x||points[0].y!==from.y))points.unshift({...from});
  const simplified:Point[]=[];
  for(let i=0;i<points.length;i++){
    if(i===0||i===points.length-1){simplified.push(points[i]);continue;}
    const a=points[i-1],b=points[i],c=points[i+1];
    const straight=(a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y);
    if(!straight)simplified.push(b);
  }
  if(simplified.length===0||simplified[simplified.length-1].x!==to.x||simplified[simplified.length-1].y!==to.y)simplified.push(to);
  return simplified;
}

export function pathLength(path:Point[]){
  let d=0;
  for(let i=1;i<path.length;i++)d+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
  return d;
}
