"use client";
import {create} from "zustand";

type State={
  acceptance:any|null;
  version:any|null;
  integrity:any|null;
  set:(patch:Partial<State>)=>void;
};

export const useFinalAcceptanceStore=create<State>(set=>({
  acceptance:null,
  version:null,
  integrity:null,
  set:patch=>set(patch)
}));
