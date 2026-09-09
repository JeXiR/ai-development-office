"use client";

import {useEffect,useRef,useState} from "react";
import {PixelOfficeV2Renderer,type RenderAgent} from "@/pixel-office-v2/renderer";

type Hit={id:string;role:string;x:number;y:number};

export function PixelOfficeV2Canvas(props:{
  agents:RenderAgent[];
  messages?:Array<{id:string;fromAgentId:string;toAgentId:string;text:string;createdAt:number;durationMs:number}>;
  onAgentClick?:(agentId:string)=>void;
  theme?:string|null;
}){
  const hostRef=useRef<HTMLDivElement|null>(null);
  const rendererRef=useRef<PixelOfficeV2Renderer|null>(null);
  const propsRef=useRef(props);
  const [hits,setHits]=useState<Hit[]>([]);
  propsRef.current=props;

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    const renderer=new PixelOfficeV2Renderer(host);
    rendererRef.current=renderer;
    let disposed=false;
    let ready=false;
    let frame=0;

    const boot=async()=>{
      await renderer.init({
        agents:propsRef.current.agents,
        messages:propsRef.current.messages,
        onAgentClick:propsRef.current.onAgentClick,
        theme:propsRef.current.theme
      });
      if(disposed){
        renderer.destroy();
        return;
      }
      ready=true;
      renderer.update({
        agents:propsRef.current.agents,
        messages:propsRef.current.messages,
        onAgentClick:propsRef.current.onAgentClick,
        theme:propsRef.current.theme
      });
      renderer.refit();
      requestAnimationFrame(()=>renderer.refit());
    };

    const tick=()=>{
      if(disposed)return;
      setHits(rendererRef.current?.hitTargets?.()||[]);
      frame=window.requestAnimationFrame(tick);
    };
    frame=window.requestAnimationFrame(tick);

    const resize=new ResizeObserver(()=>{
      rendererRef.current?.refit?.();
    });
    resize.observe(host);

    void boot().catch(error=>{
      if(!disposed){
        host.innerHTML=`<div class="pixel-office-v2-error">Pixel Office V2 renderer failed: ${String(error?.message||error)}</div>`;
      }
    });

    return()=>{
      disposed=true;
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      if(ready)renderer.destroy();
      rendererRef.current=null;
    };
  },[]);

  useEffect(()=>{
    rendererRef.current?.update({
      agents:props.agents,
      messages:props.messages,
      onAgentClick:props.onAgentClick,
      theme:props.theme
    });
  },[props.agents,props.messages,props.onAgentClick,props.theme]);

  return <div className="pixel-office-v2-wrap">
    <div className="pixel-office-v2-host" ref={hostRef}/>
    <div className="pixel-office-hit-layer">
      {hits.map(hit=><button
        key={hit.id}
        type="button"
        className="pixel-agent-hit"
        style={{left:hit.x,top:hit.y}}
        aria-label={hit.role}
        onClick={()=>props.onAgentClick?.(hit.id)}
      />)}
    </div>
  </div>;
}
