"use client";
import {create} from "zustand";
import type {WorkerConfig,WorkerRuntimeState} from "@/workers/types";
type State={configs:WorkerConfig[];states:WorkerRuntimeState[];setSnapshot:(d:any)=>void;};
export const useWorkerStore=create<State>(set=>({configs:[],states:[],setSnapshot:d=>set({configs:d?.configs||[],states:d?.states||[]})}));
