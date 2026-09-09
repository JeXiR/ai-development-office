"use client";
import {create} from "zustand";
import type {LedgerEntry,LedgerSummary} from "@/ledger/types";

type State={
  entries:LedgerEntry[];
  summary:LedgerSummary|null;
  setSnapshot:(data:{entries:LedgerEntry[];summary:LedgerSummary})=>void;
};

export const useLedgerStore=create<State>(set=>({
  entries:[],
  summary:null,
  setSnapshot:data=>set({entries:data.entries||[],summary:data.summary||null})
}));
