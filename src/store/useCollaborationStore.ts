"use client";
import {create} from "zustand";
import type {BlackboardEntry,CollaborationArtifact,DirectorTask,MailMessage} from "@/collaboration/types";

type Snapshot={
  tasks:DirectorTask[];
  messages:MailMessage[];
  blackboard:BlackboardEntry[];
  artifacts:CollaborationArtifact[];
  readyTasks:DirectorTask[];
  blockedTasks:DirectorTask[];
};

type State=Snapshot&{
  setSnapshot:(snapshot:Partial<Snapshot>)=>void;
};

const empty:Snapshot={tasks:[],messages:[],blackboard:[],artifacts:[],readyTasks:[],blockedTasks:[]};

export const useCollaborationStore=create<State>((set)=>({
  ...empty,
  setSnapshot:snapshot=>set({...empty,...snapshot})
}));
