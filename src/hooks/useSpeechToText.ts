"use client";

import {useCallback,useEffect,useRef,useState} from "react";

type SpeechCtor=new()=>SpeechRecognitionLike;

type SpeechRecognitionLike={
  lang:string;
  interimResults:boolean;
  continuous:boolean;
  maxAlternatives?:number;
  onresult:((event:any)=>void)|null;
  onerror:((event:any)=>void)|null;
  onend:(()=>void)|null;
  start:()=>void;
  abort?:()=>void;
  stop:()=>void;
};

function speechCtor():SpeechCtor|null{
  if(typeof window==="undefined")return null;
  return (window as any).SpeechRecognition||(window as any).webkitSpeechRecognition||null;
}

export function speechLocale(language:string){
  if(language==="tr")return "tr-TR";
  if(language==="de")return "de-DE";
  if(language==="ru")return "ru-RU";
  return "en-US";
}

export function useSpeechToText(language:string){
  const [listening,setListening]=useState(false);
  const [supported,setSupported]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const recRef=useRef<SpeechRecognitionLike|null>(null);
  const armedRef=useRef(false);
  const restartTimer=useRef(0);
  const onResultRef=useRef<(text:string,final:boolean)=>void>(()=>{});
  const langRef=useRef(speechLocale(language));
  langRef.current=speechLocale(language);

  const clearRestart=()=>{
    if(restartTimer.current){
      window.clearTimeout(restartTimer.current);
      restartTimer.current=0;
    }
  };

  const stopEngine=()=>{
    const rec=recRef.current;
    recRef.current=null;
    if(!rec)return;
    rec.onresult=null;
    rec.onerror=null;
    rec.onend=null;
    try{rec.abort?.();}catch{}
    try{rec.stop();}catch{}
  };

  const startEngine=useCallback(()=>{
    const Ctor=speechCtor();
    if(!Ctor||!armedRef.current)return;
    stopEngine();
    const rec=new Ctor();
    rec.lang=langRef.current;
    rec.interimResults=true;
    rec.continuous=true;
    rec.maxAlternatives=1;
    rec.onresult=(event:any)=>{
      let interim="";
      let finalText="";
      for(let i=event.resultIndex;i<event.results.length;i++){
        const piece=String(event.results[i][0]?.transcript||"").trim();
        if(!piece)continue;
        if(event.results[i].isFinal)finalText=finalText?`${finalText} ${piece}`:piece;
        else interim=interim?`${interim} ${piece}`:piece;
      }
      if(finalText)onResultRef.current(finalText,true);
      else if(interim)onResultRef.current(interim,false);
    };
    rec.onerror=(event:any)=>{
      const code=String(event?.error||"");
      if(code==="no-speech"||code==="aborted")return;
      if(code==="not-allowed"||code==="service-not-allowed"){
        armedRef.current=false;
        clearRestart();
        setError("denied");
        setListening(false);
        return;
      }
      if(code==="audio-capture"){
        armedRef.current=false;
        clearRestart();
        setError("mic");
        setListening(false);
        return;
      }
      setError(code||"error");
    };
    rec.onend=()=>{
      if(recRef.current!==rec)return;
      recRef.current=null;
      if(!armedRef.current){
        setListening(false);
        return;
      }
      clearRestart();
      restartTimer.current=window.setTimeout(()=>startEngine(),180);
    };
    recRef.current=rec;
    try{
      rec.start();
    }catch{
      if(!armedRef.current)return;
      clearRestart();
      restartTimer.current=window.setTimeout(()=>startEngine(),260);
    }
  },[]);

  useEffect(()=>{
    setSupported(!!speechCtor());
    return()=>{
      armedRef.current=false;
      clearRestart();
      stopEngine();
    };
  },[]);

  const stop=useCallback(()=>{
    armedRef.current=false;
    clearRestart();
    stopEngine();
    setListening(false);
  },[]);

  const start=useCallback((onResult:(text:string,final:boolean)=>void)=>{
    if(!speechCtor()){
      setError("unsupported");
      return false;
    }
    onResultRef.current=onResult;
    setError(null);
    armedRef.current=true;
    setListening(true);
    startEngine();
    return true;
  },[startEngine]);

  return {listening,supported,error,start,stop};
}
