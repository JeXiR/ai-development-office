"use client";

import {create} from "zustand";
import type {Lease} from "@/coordination/leases";
import type {VerifyReceipt} from "@/factory/verify-receipt";
import type {GroupTemplate} from "@/coordination/group-templates";
import type {ToolEvent,ToolNode} from "@/observability/tool-tree";

type AskResult={provider:string;ok:boolean;output:string;error?:string|null};

type State={
  leases:Lease[];
  receipts:VerifyReceipt[];
  lastAsk:AskResult|null;
  mcpId:string|null;
  templates:GroupTemplate[];
  tools:ToolEvent[];
  toolTree:ToolNode[];
  set:(patch:Partial<State>)=>void;
};

export const useCoordinationStore=create<State>(set=>({
  leases:[],
  receipts:[],
  lastAsk:null,
  mcpId:null,
  templates:[],
  tools:[],
  toolTree:[],
  set:patch=>set(patch)
}));
