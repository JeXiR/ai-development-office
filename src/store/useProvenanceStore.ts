"use client";
import {create} from "zustand";
import type {ProvenanceEvent} from "@/reproducibility/provenance";

type State={
  events:ProvenanceEvent[];
  setEvents:(events:ProvenanceEvent[])=>void;
};

export const useProvenanceStore=create<State>(set=>({
  events:[],
  setEvents:events=>set({events})
}));
