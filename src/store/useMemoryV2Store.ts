"use client";
import {create} from "zustand";
import type {MemorySearchHit,MemoryV2Record} from "@/memory-v2/types";

type GraphSnapshot={
  nodes:Array<{id:string;kind:string;label:string;room:string}>;
  edges:Array<{id:string;from:string;to:string;rel:string;title:string}>;
  rooms?:Record<string,number>;
};

type State={
  records:MemoryV2Record[];
  hits:MemorySearchHit[];
  specialties:Array<{tag:string;score:number}>;
  graph:GraphSnapshot|null;
  set:(patch:Partial<State>)=>void;
};

export const useMemoryV2Store=create<State>(set=>({
  records:[],hits:[],specialties:[],graph:null,set:patch=>set(patch)
}));
