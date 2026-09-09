import type {PixelAgentState,PixelStationId} from "./types";
import {PIXEL_OFFICE_WORLD,PIXEL_STATIONS,stationDeskSlots,stationSeat} from "./layout";
import {PIXEL_PALETTE,paletteForTheme,themeLook,type PixelPalette} from "./palette";
import {buildAgentFrameCanvas} from "./sprite-factory";
import {animationFrameAt,normalizedPixelState} from "./animation";
import {clampCamera,defaultCameraForHost,type PixelCameraState} from "./camera";
import {createMovement,retargetMovement,updateMovement,type MovementState} from "./movement";
import {envelopePoint} from "./message-animation";

export type RenderAgent={
  id:string;
  role:string;
  state:string;
  station:PixelStationId;
  targetStation?:PixelStationId|null;
  speech?:string|null;
  progress?:number|null;
};

export type RenderMessage={
  id:string;
  fromAgentId:string;
  toAgentId:string;
  text:string;
  createdAt:number;
  durationMs:number;
};

function labelFor(agent:RenderAgent){
  const caption=String(agent.role||agent.id||"agent");
  return caption.length>10?caption.slice(0,9)+"…":caption;
}

export function speechCaption(agent:RenderAgent){
  const raw=String(agent.speech||"").trim();
  if(raw)return raw.slice(0,56);
  const state=normalizedPixelState(agent.state);
  if(state==="working"||state==="typing")return "Working…";
  if(state==="thinking")return "Thinking…";
  if(state==="testing")return "Testing…";
  if(state==="talking")return "Talking…";
  if(state==="blocked")return "Blocked";
  return "";
}

export type PixelOfficeRendererInput={
  agents:RenderAgent[];
  messages?:RenderMessage[];
  camera?:PixelCameraState;
  onAgentClick?:(agentId:string)=>void;
  theme?:string|null;
};

type AgentNode={
  container:any;
  sprite:any;
  label:any;
  speech:any;
  speechBg:any;
  agent:RenderAgent;
  seatIndex:number;
  movement:MovementState;
};

export class PixelOfficeV2Renderer{
  private app:any=null;
  private world:any=null;
  private decor:any=null;
  private pixi:any=null;
  private palette:PixelPalette=PIXEL_PALETTE;
  private themeId="classic-cc0";
  private nodes:AgentNode[]=[];
  private startedAt=performance.now();
  private tickerFn:any=null;
  private camera={x:0,y:0,zoom:1};
  private messages:RenderMessage[]=[];
  private messageLayer:any=null;
  private lastTick=performance.now();
  private textureCache=new Map<string,any>();
  private onAgentClick?:(agentId:string)=>void;
  private didPan=false;

  constructor(private readonly host:HTMLElement){}

  async init(input:PixelOfficeRendererInput){
    this.pixi=await import("pixi.js");
    const {Application,Container}=this.pixi;
    this.themeId=input.theme||"classic-cc0";
    this.palette=paletteForTheme(this.themeId);
    this.app=new Application();
    await this.app.init({
      resizeTo:this.host,
      antialias:false,
      backgroundColor:this.palette.floor,
      resolution:Math.min(2,window.devicePixelRatio||1),
      autoDensity:true
    });
    this.app.canvas.className="pixel-office-v2-canvas";
    this.host.replaceChildren(this.app.canvas);

    this.world=new Container();
    this.world.eventMode="passive";
    this.app.stage.eventMode="static";
    this.app.stage.addChild(this.world);
    this.onAgentClick=input.onAgentClick;
    this.camera=clampCamera(input.camera||defaultCameraForHost(this.host.clientWidth,this.host.clientHeight));

    this.decor=new Container();
    this.world.addChild(this.decor);
    this.drawFloor();
    this.drawStations();
    this.messageLayer=new Container();
    this.world.addChild(this.messageLayer);
    this.messages=input.messages||[];
    this.setAgents(input.agents,input.onAgentClick);
    this.applyCamera();

    this.tickerFn=()=>this.animate();
    this.app.ticker.add(this.tickerFn);
    this.attachCameraControls();
  }

  private drawFloor(){
    const {Graphics}=this.pixi;
    const look=themeLook(this.themeId);
    const g=new Graphics();
    g.rect(0,0,PIXEL_OFFICE_WORLD.width,PIXEL_OFFICE_WORLD.height).fill(this.palette.floor);

    const tile=look.tile;
    for(let y=0;y<PIXEL_OFFICE_WORLD.height;y+=tile){
      for(let x=0;x<PIXEL_OFFICE_WORLD.width;x+=tile){
        if(((x+y)/tile)%2===0)g.rect(x,y,tile,tile).fill(this.palette.floorAlt);
      }
    }

    if(look.stripes){
      for(let x=40;x<PIXEL_OFFICE_WORLD.width-40;x+=28){
        g.rect(x,28,6,PIXEL_OFFICE_WORLD.height-56).fill({color:this.palette.desk,alpha:.12});
      }
    }

    if(look.hellGlow){
      g.rect(10,10,PIXEL_OFFICE_WORLD.width-20,PIXEL_OFFICE_WORLD.height-20)
        .stroke({width:4,color:this.palette.monitorGlow,alpha:.55});
    }

    g.rect(18,18,PIXEL_OFFICE_WORLD.width-36,PIXEL_OFFICE_WORLD.height-36)
      .stroke({width:8,color:this.palette.roomEdge});
    this.decor.addChild(g);
  }

  private drawStations(){
    const {Container,Graphics,Text}=this.pixi;
    const look=themeLook(this.themeId);
    for(const station of PIXEL_STATIONS){
      const c=new Container();
      c.position.set(station.x,station.y);

      const room=new Graphics();
      room.roundRect(0,0,station.width,station.height,look.id==="luxury-office"?12:8)
        .fill({color:this.palette.room,alpha:.95})
        .stroke({width:look.hellGlow?3:2,color:this.palette.roomEdge});
      if(look.hellGlow){
        room.rect(6,station.height-8,station.width-12,4).fill({color:this.palette.monitorGlow,alpha:.45});
      }
      c.addChild(room);

      const desk=new Graphics();
      if(station.kind==="meeting"){
        desk.roundRect(48,36,station.width-96,look.id==="luxury-office"?34:28,8).fill(this.palette.desk);
        if(look.id==="luxury-office")desk.roundRect(56,40,station.width-112,8,4).fill(this.palette.monitorGlow);
      }else if(station.kind==="lounge"){
        desk.roundRect(42,42,90,24,8).fill(this.palette.lounge);
        desk.roundRect(station.width-132,42,90,24,8).fill(this.palette.lounge);
        if(look.plants){
          desk.rect(18,50,10,16).fill("#3d7a4a");
          desk.rect(station.width-28,50,10,16).fill("#3d7a4a");
        }
      }else{
        const slots=stationDeskSlots(station,look.denseDesks);
        for(let i=0;i<slots.length;i++){
          const slot=slots[i];
          if(look.cubicles&&i>0)desk.rect(slot.localX-8,station.height-82,3,70).fill(this.palette.roomEdge);
          desk.rect(slot.localX,slot.localY,slot.width,slot.height).fill(this.palette.desk);
          desk.rect(slot.localX+12,station.height-32,slot.width-24,8).fill(this.palette.deskEdge);
          if(slot.monitor){
            desk.rect(slot.monitor.x,slot.monitor.y,slot.monitor.w,slot.monitor.h).fill(this.palette.monitor);
            desk.rect(slot.monitor.x+3,slot.monitor.y+3,slot.monitor.w-6,slot.monitor.h-7).fill(this.palette.monitorGlow);
          }
        }
        if(look.plants){
          desk.rect(8,22,8,14).fill("#3d7a4a");
          desk.rect(station.width-16,22,8,14).fill("#3d7a4a");
        }
      }
      c.addChild(desk);

      const title=new Text({
        text:station.label,
        style:{
          fontFamily:"monospace",
          fontSize:13,
          fontWeight:"700",
          fill:this.palette.label
        }
      });
      title.position.set(12,10);
      c.addChild(title);
      this.decor.addChild(c);
    }
  }

  setTheme(theme?:string|null){
    const id=theme||"classic-cc0";
    if(id===this.themeId&&this.decor?.children?.length)return;
    this.themeId=id;
    this.palette=paletteForTheme(id);
    if(this.app?.renderer?.background)this.app.renderer.background.color=this.palette.floor;
    if(!this.decor||!this.pixi)return;
    try{this.decor.removeChildren().forEach((c:any)=>{try{c.destroy({children:true,texture:false,textureSource:false});}catch{}});}catch{}
    this.drawFloor();
    this.drawStations();
  }

  private textureFor(agentId:string,state:PixelAgentState,facing:"up"|"down"|"left"|"right",frame:number){
    const key=`${agentId}:${state}:${facing}:${frame}`;
    const hit=this.textureCache.get(key);
    if(hit)return hit;
    const canvas=buildAgentFrameCanvas(agentId,state,facing,frame);
    const texture=this.pixi.Texture.from(canvas);
    if(texture?.source)texture.source.scaleMode="nearest";
    this.textureCache.set(key,texture);
    return texture;
  }

  setAgents(agents:RenderAgent[],onAgentClick?:PixelOfficeRendererInput["onAgentClick"]){
    if(onAgentClick)this.onAgentClick=onAgentClick;
    const {Container,Sprite,Text,Graphics}=this.pixi;
    const previousById=new Map(this.nodes.map(n=>[n.agent.id,n.movement.position]));
    for(const n of this.nodes){
      try{n.container.destroy({children:true,texture:false,textureSource:false});}catch{}
    }
    this.nodes=[];

    const dense=themeLook(this.themeId).denseDesks;
    const seatCount=new Map<string,number>();
    for(const agent of agents){
      const station=(agent.targetStation||agent.station||"lounge") as PixelStationId;
      const seatIndex=seatCount.get(station)||0;
      seatCount.set(station,seatIndex+1);
      const seat=stationSeat(station,seatIndex,dense);
      const start=previousById.get(agent.id)||seat;
      const container=new Container();
      container.position.set(start.x,start.y);
      container.eventMode="static";
      container.cursor="pointer";
      container.hitArea={contains:(x:number,y:number)=>x>=-36&&x<=36&&y>=-78&&y<=22};
      container.on("pointertap",()=>{
        if(this.didPan)return;
        this.onAgentClick?.(agent.id);
      });

      const state=normalizedPixelState(agent.state);
      const sprite=new Sprite(this.textureFor(agent.id,state,"down",0));
      sprite.anchor.set(.5,1);
      sprite.scale.set(1.2);
      sprite.texture.source.scaleMode="nearest";
      container.addChild(sprite);

      const badge=new Graphics();
      const labelShift=(seatIndex%2)*14-7;
      badge.roundRect(-22+labelShift,2,44,11,3).fill({color:"#07111c",alpha:.92}).stroke({width:1,color:"#28445e"});
      container.addChild(badge);

      const caption=labelFor(agent);
      const label=new Text({
        text:caption,
        style:{fontFamily:"monospace",fontSize:7,fontWeight:"700",fill:"#c2deed"}
      });
      label.anchor.set(.5,0);
      label.position.set(labelShift,4);
      container.addChild(label);

      const speechBg=new Graphics();
      container.addChild(speechBg);

      const speech=new Text({
        text:"",
        style:{fontFamily:"monospace",fontSize:8,fill:"#e8f4fb",wordWrap:true,wordWrapWidth:112}
      });
      speech.anchor.set(.5,1);
      speech.position.set(0,-50);
      container.addChild(speech);

      this.world.addChild(container);
      const movement=createMovement(start,seat);
      const node={container,sprite,label,speech,speechBg,agent,seatIndex,movement};
      this.paintSpeech(node,speechCaption(agent));
      this.nodes.push(node);
    }
  }

  update(input:PixelOfficeRendererInput){
    if(!this.app||!this.pixi||!this.world)return;
    this.onAgentClick=input.onAgentClick;
    if(input.theme)this.setTheme(input.theme);
    this.messages=input.messages||[];
    const incoming=new Set(input.agents.map(a=>a.id));
    const existing=new Set(this.nodes.map(n=>n.agent.id));
    const rosterChanged=incoming.size!==existing.size||[...incoming].some(id=>!existing.has(id));
    if(rosterChanged){
      this.setAgents(input.agents,input.onAgentClick);
      return;
    }
    const byId=new Map(this.nodes.map(n=>[n.agent.id,n]));
    const seatCount=new Map<string,number>();
    const dense=themeLook(this.themeId).denseDesks;

    for(const agent of input.agents){
      const node=byId.get(agent.id);
      const station=(agent.targetStation||agent.station||"lounge") as PixelStationId;
      if(!node)continue;
      const seatIndex=seatCount.get(station)||0;
      seatCount.set(station,seatIndex+1);
      node.seatIndex=seatIndex;
      const seat=stationSeat(station,seatIndex,dense);
      if(node.movement.target.x!==seat.x||node.movement.target.y!==seat.y){
        retargetMovement(node.movement,seat);
      }
      node.agent=agent;
      if(node.label)node.label.text=labelFor(agent);
      this.paintSpeech(node,speechCaption(agent));
    }
  }

  private paintSpeech(node:AgentNode,text:string){
    const show=Boolean(text);
    if(node.speech){
      node.speech.text=text;
      node.speech.visible=show;
    }
    if(!node.speechBg)return;
    node.speechBg.clear();
    node.speechBg.visible=show;
    if(!show)return;
    const w=Math.min(120,Math.max(40,8+text.length*5.2));
    const lines=Math.ceil(text.length/22);
    const h=12+Math.max(0,lines-1)*9;
    node.speechBg.roundRect(-w/2,-52-h,w,h+2,4)
      .fill({color:"#07111c",alpha:.94})
      .stroke({width:1,color:"#3d6a86"});
    node.speechBg.moveTo(-4,-50).lineTo(0,-44).lineTo(4,-50).fill({color:"#07111c"});
  }

  private animateMessages(){
    if(!this.messageLayer)return;
    this.messageLayer.removeChildren().forEach((c:any)=>{try{c.destroy({children:true,texture:false,textureSource:false});}catch{}});
    const now=performance.now();
    const {Container,Graphics,Text}=this.pixi;

    const positionOf=(id:string)=>{
      const node=this.nodes.find(n=>n.agent.id===id);
      return node?{x:node.container.x,y:node.container.y-46}:null;
    };

    for(const msg of this.messages){
      const from=positionOf(msg.fromAgentId),to=positionOf(msg.toAgentId);
      if(!from||!to)continue;
      const progress=(now-msg.createdAt)/msg.durationMs;
      if(progress<0||progress>1)continue;
      const p=envelopePoint(from,to,progress);

      const c=new Container();
      c.position.set(p.x,p.y);
      const g=new Graphics();
      g.rect(-7,-5,14,10).fill("#d8e7ef").stroke({width:1,color:"#30485c"});
      g.moveTo(-7,-5).lineTo(0,1).lineTo(7,-5).stroke({width:1,color:"#748b9d"});
      c.addChild(g);

      if(progress>.38&&progress<.72&&msg.text){
        const t=new Text({text:msg.text.slice(0,28),style:{fontFamily:"monospace",fontSize:8,fill:"#d9ebf5"}});
        t.anchor.set(.5,1); t.position.set(0,-10); c.addChild(t);
      }
      this.messageLayer.addChild(c);
    }
  }

  private animate(){
    const now=performance.now();
    const elapsed=now-this.startedAt;
    const dt=Math.min(.05,Math.max(0,(now-this.lastTick)/1000));
    this.lastTick=now;

    for(const node of this.nodes){
      updateMovement(node.movement,dt);
      node.container.position.set(node.movement.position.x,node.movement.position.y);
      const mapped=normalizedPixelState(node.agent.state);
      const state=node.movement.moving?"walking":mapped;
      const frame=animationFrameAt(state,elapsed);
      const facing=node.movement.facing;
      const texture=this.textureFor(node.agent.id,state,facing,frame);
      if(node.sprite.texture!==texture)node.sprite.texture=texture;

      if(state==="thinking")node.container.y+=Math.sin(elapsed/350)*.02;
      if(state==="blocked")node.container.alpha=.65+.35*(.5+.5*Math.sin(elapsed/160));
      else node.container.alpha=1;
    }
    this.animateMessages();
  }

  private applyCamera(){
    if(!this.world||!this.host)return;
    const width=this.host.clientWidth||900;
    const height=this.host.clientHeight||520;
    const fit=Math.min(width/PIXEL_OFFICE_WORLD.width,height/PIXEL_OFFICE_WORLD.height);
    const scale=Math.max(fit,0.28)*this.camera.zoom;
    this.world.scale.set(scale);
    this.world.position.set(
      (width-PIXEL_OFFICE_WORLD.width*scale)/2+this.camera.x,
      (height-PIXEL_OFFICE_WORLD.height*scale)/2+this.camera.y
    );
  }

  private attachCameraControls(){
    let dragging=false,lastX=0,lastY=0;
    const canvas=this.app.canvas as HTMLCanvasElement;
    canvas.addEventListener("wheel",(event:WheelEvent)=>{
      event.preventDefault();
      this.camera=clampCamera({...this.camera,zoom:this.camera.zoom+(event.deltaY<0?.1:-.1)});
      this.applyCamera();
    },{passive:false});

    canvas.addEventListener("pointerdown",(e:PointerEvent)=>{
      this.didPan=false;
      dragging=false;
      lastX=e.clientX;
      lastY=e.clientY;
    });
    canvas.addEventListener("pointermove",(e:PointerEvent)=>{
      if(e.buttons===0)return;
      const dx=e.clientX-lastX;
      const dy=e.clientY-lastY;
      if(!dragging){
        if(Math.hypot(dx,dy)<6)return;
        dragging=true;
        this.didPan=true;
        try{canvas.setPointerCapture(e.pointerId);}catch{}
      }
      this.camera=clampCamera({...this.camera,x:this.camera.x+dx,y:this.camera.y+dy});
      lastX=e.clientX;lastY=e.clientY;this.applyCamera();
    });
    const endDrag=()=>{dragging=false;};
    canvas.addEventListener("pointerup",endDrag);
    canvas.addEventListener("pointercancel",endDrag);
    window.addEventListener("resize",this.applyCameraBound);
  }

  hitTargets(){
    if(!this.world)return [] as Array<{id:string;role:string;x:number;y:number}>;
    const scale=this.world.scale.x||1;
    return this.nodes.map(node=>({
      id:node.agent.id,
      role:String(node.agent.role||node.agent.id),
      x:this.world.position.x+node.container.position.x*scale,
      y:this.world.position.y+node.container.position.y*scale
    }));
  }

  refit(){
    if(!this.app||!this.world)return;
    try{this.app.resize?.();}catch{}
    this.applyCamera();
  }

  private applyCameraBound=()=>this.applyCamera();

  destroy(){
    window.removeEventListener("resize",this.applyCameraBound);
    if(this.app&&this.tickerFn)this.app.ticker.remove(this.tickerFn);
    this.tickerFn=null;
    for(const n of this.nodes){
      try{n.container.destroy({children:true,texture:false,textureSource:false});}catch{}
    }
    this.nodes=[];
    for(const texture of this.textureCache.values()){
      try{texture.destroy(true);}catch{}
    }
    this.textureCache.clear();
    try{this.messageLayer?.removeChildren().forEach((c:any)=>{try{c.destroy({children:true,texture:false,textureSource:false});}catch{}});}catch{}
    try{
      this.app?.destroy({
        removeView:true,
        children:true,
        texture:false,
        textureSource:false
      });
    }catch{}
    this.app=null;
    this.world=null;
    this.decor=null;
    this.messageLayer=null;
    this.pixi=null;
  }
}
