export function lerp(a:number,b:number,t:number){return a+(b-a)*t;}
export function easeInOut(t:number){
  const x=Math.max(0,Math.min(1,t));
  return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
}
export function envelopePoint(from:{x:number;y:number},to:{x:number;y:number},progress:number){
  const t=easeInOut(progress);
  const x=lerp(from.x,to.x,t);
  const baseY=lerp(from.y,to.y,t);
  const arc=Math.sin(Math.PI*t)*-28;
  return {x,y:baseY+arc};
}
