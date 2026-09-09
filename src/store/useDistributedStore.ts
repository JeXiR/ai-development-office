"use client";
import {create} from "zustand";
import type {DistributedJob,WorkerCapability} from "@/distributed/types";

type State={
  jobs:DistributedJob[];
  capabilities:WorkerCapability[];
  logs:Record<string,string>;
  lastArtifact:any|null;
  set:(patch:Partial<State>)=>void;
  appendLog:(jobId:string,chunk:string)=>void;
};

export const useDistributedStore=create<State>(set=>({
  jobs:[],capabilities:[],logs:{},lastArtifact:null,
  set:patch=>set(patch),
  appendLog:(jobId,chunk)=>set(state=>({logs:{...state.logs,[jobId]:(state.logs[jobId]||"")+chunk}}))
}));
