"use client";
import {create} from "zustand";
import type {MemorySearchHit,MemoryV2Record} from "@/memory-v2/types";

type State={
  records:MemoryV2Record[];
  hits:MemorySearchHit[];
  specialties:Array<{tag:string;score:number}>;
  set:(patch:Partial<State>)=>void;
};

export const useMemoryV2Store=create<State>(set=>({
  records:[],hits:[],specialties:[],set:patch=>set(patch)
}));
