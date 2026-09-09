"use client";
import {create} from "zustand";

type AgentDeskStore={
  deskAgentId:string|null;
  open:(agentId:string)=>void;
  close:()=>void;
};

export const useAgentDeskStore=create<AgentDeskStore>((set)=>({
  deskAgentId:null,
  open:(agentId)=>set({deskAgentId:String(agentId||"").trim()||null}),
  close:()=>set({deskAgentId:null})
}));
