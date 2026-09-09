"use client";
import {create} from "zustand";
import type {ProviderHealth,ProviderRouteDecision} from "@/providers/types";

type State={
  health:ProviderHealth[];
  routeDecision:ProviderRouteDecision|null;
  setHealth:(rows:ProviderHealth[])=>void;
  setRouteDecision:(row:ProviderRouteDecision|null)=>void;
};

export const useProviderStore=create<State>(set=>({
  health:[],
  routeDecision:null,
  setHealth:health=>set({health}),
  setRouteDecision:routeDecision=>set({routeDecision})
}));
