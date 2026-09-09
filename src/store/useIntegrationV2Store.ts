"use client";
import {create} from "zustand";
import type {IntegrationAuditEntry,IntegrationActionResult,IntegrationWatch} from "@/integrations-v2/types";

type State={
  audit:IntegrationAuditEntry[];
  watches:IntegrationWatch[];
  lastResult:IntegrationActionResult|null;
  set:(patch:Partial<State>)=>void;
};

export const useIntegrationV2Store=create<State>(set=>({
  audit:[],watches:[],lastResult:null,set:patch=>set(patch)
}));
