"use client";
import {create} from "zustand";
import type {GitFileDiff,GitGraphSnapshot,GitSnapshotMeta} from "@/git-intelligence/types";

type State={
  graph:GitGraphSnapshot|null;
  workingTree:GitFileDiff[];
  snapshots:GitSnapshotMeta[];
  setGraph:(graph:GitGraphSnapshot)=>void;
  setWorkingTree:(workingTree:GitFileDiff[])=>void;
  setSnapshots:(snapshots:GitSnapshotMeta[])=>void;
};

export const useGitIntelligenceStore=create<State>(set=>({
  graph:null,workingTree:[],snapshots:[],
  setGraph:graph=>set({graph}),
  setWorkingTree:workingTree=>set({workingTree}),
  setSnapshots:snapshots=>set({snapshots})
}));
