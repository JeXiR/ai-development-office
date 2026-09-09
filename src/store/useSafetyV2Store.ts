"use client";import {create} from "zustand";import type {ApprovalRequest,AuthorizationResult,CommandRisk,SandboxProfile} from "@/safety-v2/types";
type State={approvals:ApprovalRequest[];profile:SandboxProfile|null;permissionPolicy:any|null;commandRisk:CommandRisk|null;authorization:AuthorizationResult|null;budget:any|null;set:(p:Partial<State>)=>void;};
export const useSafetyV2Store=create<State>(set=>({approvals:[],profile:null,permissionPolicy:null,commandRisk:null,authorization:null,budget:null,set:p=>set(p)}));
