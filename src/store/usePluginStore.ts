"use client";
import {create} from "zustand";

export type PluginRow={
  id:string;name:string;version:string;description:string;permissions:string[];enabled:boolean;errors:string[];
};

type State={plugins:PluginRow[];setPlugins:(plugins:PluginRow[])=>void};

export const usePluginStore=create<State>(set=>({
  plugins:[],
  setPlugins:plugins=>set({plugins})
}));
