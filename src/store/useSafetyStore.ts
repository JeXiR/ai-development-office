"use client";
import {create} from "zustand";
import type {SafetyIncident,SafetyPolicy} from "@/safety/types";

type Snapshot={policy:SafetyPolicy|null;incidents:SafetyIncident[]};

type State=Snapshot&{
  setSnapshot:(snapshot:Snapshot)=>void;
};

export const useSafetyStore=create<State>((set)=>({
  policy:null,
  incidents:[],
  setSnapshot:snapshot=>set(snapshot)
}));
