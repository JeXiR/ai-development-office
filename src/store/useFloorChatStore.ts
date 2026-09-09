"use client";
import {create} from "zustand";
import type {FloorChatMemory,FloorChatMessage} from "@/pixel-office-v2/floor-chat-types";
import {emptyFloorMemory} from "@/pixel-office-v2/floor-chat-engine";

const STORAGE_PREFIX="office-floor-chat:";
const MAX_MESSAGES=180;

type PersistShape={
  messages:FloorChatMessage[];
  memory:FloorChatMemory;
};

type State={
  projectId:string;
  lang:string;
  messages:FloorChatMessage[];
  memory:FloorChatMemory;
  paused:boolean;
  hydrate:(projectId:string,lang:string)=>void;
  append:(messages:FloorChatMessage[],memory:FloorChatMemory)=>void;
  setPaused:(paused:boolean)=>void;
  clear:()=>void;
};

function persistKey(projectId:string,lang:string){
  return `${STORAGE_PREFIX}${projectId||"none"}:${lang||"en"}`;
}

function readPersist(projectId:string,lang:string):PersistShape{
  if(typeof window==="undefined")return {messages:[],memory:emptyFloorMemory()};
  try{
    const raw=window.localStorage.getItem(persistKey(projectId,lang));
    if(!raw)return {messages:[],memory:emptyFloorMemory()};
    const parsed=JSON.parse(raw) as PersistShape;
    return {
      messages:Array.isArray(parsed.messages)?parsed.messages.slice(-MAX_MESSAGES):[],
      memory:parsed.memory&&typeof parsed.memory==="object"?{
        fingerprints:parsed.memory.fingerprints||[],
        texts:parsed.memory.texts||[],
        lastStatus:parsed.memory.lastStatus||{},
        lastAt:parsed.memory.lastAt||{},
        angle:parsed.memory.angle||{}
      }:emptyFloorMemory()
    };
  }catch{
    return {messages:[],memory:emptyFloorMemory()};
  }
}

function writePersist(projectId:string,lang:string,payload:PersistShape){
  if(typeof window==="undefined")return;
  try{
    window.localStorage.setItem(persistKey(projectId,lang),JSON.stringify({
      messages:payload.messages.slice(-MAX_MESSAGES),
      memory:payload.memory
    }));
  }catch{/* ignore quota */}
}

export const useFloorChatStore=create<State>((set,get)=>({
  projectId:"",
  lang:"en",
  messages:[],
  memory:emptyFloorMemory(),
  paused:false,
  hydrate:(projectId,lang)=>{
    const next=readPersist(projectId,lang);
    set({projectId,lang,messages:next.messages,memory:next.memory});
  },
  append:(messages,memory)=>{
    const {projectId,lang}=get();
    const next={
      messages:[...get().messages,...messages].slice(-MAX_MESSAGES),
      memory
    };
    writePersist(projectId,lang,next);
    set(next);
  },
  setPaused:(paused)=>set({paused}),
  clear:()=>{
    const {projectId,lang}=get();
    const empty={messages:[],memory:emptyFloorMemory()};
    writePersist(projectId,lang,empty);
    set(empty);
  }
}));
