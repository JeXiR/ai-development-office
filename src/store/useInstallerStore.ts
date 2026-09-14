"use client";
import {create} from "zustand";

type State={
  prerequisites:any[];
  version:any|null;
  runtime:any|null;
  diagnostics:any|null;
  staged:any|null;
  lastUpdateResult:any|null;
  codesign:any|null;
  set:(patch:Partial<State>)=>void;
};

export const useInstallerStore=create<State>(set=>({
  prerequisites:[],version:null,runtime:null,diagnostics:null,staged:null,lastUpdateResult:null,codesign:null,
  set:patch=>set(patch)
}));
