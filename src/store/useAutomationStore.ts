"use client";
import {create} from "zustand";
import type {AutomationSnapshot} from "@/automation/types";

type State={
  snapshot:AutomationSnapshot;
  setSnapshot:(snapshot:AutomationSnapshot)=>void;
};

export const useAutomationStore=create<State>(set=>({
  snapshot:{missions:[],heartbeats:[]},
  setSnapshot:snapshot=>set({snapshot})
}));
