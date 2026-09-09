"use client";
import {create} from "zustand";
import type {CommandPaletteEntry,ModalState,SplitEditorState,ToastMessage,WorkspaceTab} from "@/ux/types";

type State={
  tabs:WorkspaceTab[];
  activeTabId:string|null;
  split:SplitEditorState;
  toasts:ToastMessage[];
  modal:ModalState|null;
  paletteOpen:boolean;
  paletteQuery:string;
  paletteEntries:CommandPaletteEntry[];
  openTab:(tab:WorkspaceTab)=>void;
  closeTab:(id:string)=>void;
  setActiveTab:(id:string)=>void;
  setSplit:(split:Partial<SplitEditorState>)=>void;
  pushToast:(toast:ToastMessage)=>void;
  dismissToast:(id:string)=>void;
  setModal:(modal:ModalState|null)=>void;
  setPaletteOpen:(open:boolean)=>void;
  setPaletteQuery:(query:string)=>void;
  setPaletteEntries:(entries:CommandPaletteEntry[])=>void;
};

export const useUxStore=create<State>(set=>({
  tabs:[],activeTabId:null,
  split:{enabled:false,primaryTabId:null,secondaryTabId:null},
  toasts:[],modal:null,paletteOpen:false,paletteQuery:"",paletteEntries:[],
  openTab:tab=>set(state=>{
    const tabs=state.tabs.some(x=>x.id===tab.id)?state.tabs:[...state.tabs,tab];
    return {tabs,activeTabId:tab.id};
  }),
  closeTab:id=>set(state=>{
    const tabs=state.tabs.filter(x=>x.id!==id);
    const activeTabId=state.activeTabId===id?(tabs.at(-1)?.id||null):state.activeTabId;
    return {tabs,activeTabId};
  }),
  setActiveTab:id=>set({activeTabId:id}),
  setSplit:split=>set(state=>({split:{...state.split,...split}})),
  pushToast:toast=>set(state=>({toasts:[...state.toasts,toast].slice(-6)})),
  dismissToast:id=>set(state=>({toasts:state.toasts.filter(x=>x.id!==id)})),
  setModal:modal=>set({modal}),
  setPaletteOpen:paletteOpen=>set({paletteOpen}),
  setPaletteQuery:paletteQuery=>set({paletteQuery}),
  setPaletteEntries:paletteEntries=>set({paletteEntries})
}));
