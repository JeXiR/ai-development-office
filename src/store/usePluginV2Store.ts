"use client";
import {create} from "zustand";

type State={
  manifests:any[];
  states:any[];
  contributions:{providers:any[];tools:any[];triggers:any[];panels:any[]};
  lastResult:any[];
  set:(patch:Partial<State>)=>void;
};

export const usePluginV2Store=create<State>(set=>({
  manifests:[],states:[],contributions:{providers:[],tools:[],triggers:[],panels:[]},lastResult:[],
  set:patch=>set(patch)
}));
