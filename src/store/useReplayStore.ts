"use client";
import {create} from "zustand";
import type {SessionReplay} from "@/replay/types";
type State={sessions:string[];selected:SessionReplay|null;setSessions:(s:string[])=>void;setSelected:(s:SessionReplay|null)=>void;};
export const useReplayStore=create<State>(set=>({sessions:[],selected:null,setSessions:sessions=>set({sessions}),setSelected:selected=>set({selected})}));
