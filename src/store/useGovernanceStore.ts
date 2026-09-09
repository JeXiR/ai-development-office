"use client";
import {create} from "zustand";

type State={
  policy:any|null;
  members:any[];
  decisions:any[];
  waivers:any[];
  evidence:any[];
  signoffs:any[];
  audit:any|null;
  stableAcceptance:any|null;
  release:any|null;
  set:(patch:Partial<State>)=>void;
};

export const useGovernanceStore=create<State>(set=>({
  policy:null,members:[],decisions:[],waivers:[],evidence:[],signoffs:[],
  audit:null,stableAcceptance:null,release:null,set:patch=>set(patch)
}));
