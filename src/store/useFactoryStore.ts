"use client";

import {create} from "zustand";
import type {FactorySettings, FactoryState} from "@/factory/autonomous-factory";
import {DEFAULT_FACTORY_SETTINGS, emptyFactoryState} from "@/factory/autonomous-factory";

type FactorySnapshot={
  state:FactoryState;
  settings:FactorySettings;
  customCli:{command:string;args:string[]};
};

type Store={
  byProject:Record<string, FactorySnapshot>;
  upsert:(projectId:string, snapshot:Partial<FactorySnapshot>&{state?:FactoryState})=>void;
};

export const useFactoryStore=create<Store>((set)=>({
  byProject:{},
  upsert:(projectId, snapshot)=>set(current=>{
    const prev=current.byProject[projectId]||{
      state:emptyFactoryState(projectId),
      settings:DEFAULT_FACTORY_SETTINGS,
      customCli:{command:"", args:["{prompt}"]}
    };
    return {
      byProject:{
        ...current.byProject,
        [projectId]:{
          state:snapshot.state||prev.state,
          settings:snapshot.settings||prev.settings,
          customCli:snapshot.customCli||prev.customCli
        }
      }
    };
  })
}));
