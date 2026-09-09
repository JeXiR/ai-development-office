"use client";
import {create} from "zustand";
import type {AgentQualityScore,DynamicTeam,RecoveryDecision,RetryStrategy} from "@/autonomy/types";

type State={
  team:DynamicTeam|null;
  scores:AgentQualityScore[];
  route:any|null;
  retry:RetryStrategy|null;
  recovery:RecoveryDecision|null;
  set:(patch:Partial<State>)=>void;
};

export const useAutonomyStore=create<State>(set=>({
  team:null,scores:[],route:null,retry:null,recovery:null,
  set:patch=>set(patch)
}));
