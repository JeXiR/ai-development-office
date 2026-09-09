"use client";
import {create} from "zustand";
import type {IntegrationConfig,IntegrationStatus,McpServerConfig} from "@/integrations/types";
type State={configs:IntegrationConfig[];status:IntegrationStatus[];mcpServers:McpServerConfig[];setSnapshot:(d:any)=>void;};
export const useIntegrationStore=create<State>(set=>({configs:[],status:[],mcpServers:[],setSnapshot:d=>set({configs:d?.configs||[],status:d?.status||[],mcpServers:d?.mcpServers||[]})}));
