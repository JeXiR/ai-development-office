"use client";
import {create} from "zustand";

type State={
  prerequisites:any[];
  version:any|null;
  runtime:any|null;
  diagnostics:any|null;
  staged:any|null;
  lastUpdateResult:any|null;
  set:(patch:Partial<State>)=>void;
};

export const useInstallerStore=create<State>(set=>({
  prerequisites:[],version:null,runtime:null,diagnostics:null,staged:null,lastUpdateResult:null,
  set:patch=>set(patch)
}));
