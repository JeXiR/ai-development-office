"use client";

import {useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

type StreamEvent={type:string;streamId:string;providerId:string;delta?:string;error?:string;at:string};

export function ProviderStreamingPanel(){
  const {t}=useOfficeI18n();
  const [events,setEvents]=useState<StreamEvent[]>([]);
  const [activeStream,setActiveStream]=useState<string|null>(null);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="provider_stream_event"){
          setEvents(prev=>[...prev.slice(-99),m.data]);
          if(m.data.type==="stream.started")setActiveStream(m.data.streamId);
          if(["stream.completed","stream.cancelled","stream.failed"].includes(m.data.type))setActiveStream(x=>x===m.data.streamId?null:x);
        }
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    return()=>socket.removeEventListener("message",onMessage);
  });

  const cancel=()=>{
    if(!activeStream)return;
    sendOffice({action:"cancel_universal_provider_stream",data:{streamId:activeStream}});
  };

  return <section className="panel provider-streaming-panel" data-help="provider-streaming">
    <div className="section-heading">
      <div><div className="eyebrow">{t("stream.eyebrow")}</div><h2>{t("stream.title")}</h2></div>
      <span>{activeStream?t("office.working"):t("office.idle")}</span>
    </div>
    <div className="skills-toolbar">
      <button onClick={()=>setEvents([])}>{t("settings.clearEvents")}</button>
      <button onClick={cancel} disabled={!activeStream}>{t("settings.cancelStream")}</button>
    </div>
    <div className="stream-event-log">
      {events.length?events.slice(-20).map((e,i)=><div key={`${e.streamId}-${i}`}><b>{e.providerId}</b><span>{e.type}</span><code>{e.delta||e.error||""}</code></div>):<p className="muted">{t("stream.empty")}</p>}
    </div>
  </section>;
}
