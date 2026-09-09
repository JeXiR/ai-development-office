"use client";
import {create} from "zustand";
import type {RuntimeEvent} from "@/runtime/types";
import type {MailMessage,DirectorTask} from "@/collaboration/types";
import {PixelOfficeReducer} from "@/pixel-office/reducer";
import type {PixelOfficeSnapshot} from "@/pixel-office/types";
const reducer=new PixelOfficeReducer();
type State={snapshot:PixelOfficeSnapshot;applyRuntime:(e:RuntimeEvent)=>void;applyMessage:(m:MailMessage)=>void;applyFile:(p:string,a:string|null)=>void;syncTasks:(t:DirectorTask[])=>void;reset:()=>void;};
export const usePixelOfficeStore=create<State>(set=>({snapshot:reducer.initial(),applyRuntime:e=>set(s=>({snapshot:reducer.runtime(s.snapshot,e)})),applyMessage:m=>set(s=>({snapshot:reducer.message(s.snapshot,m)})),applyFile:(p,a)=>set(s=>({snapshot:reducer.file(s.snapshot,p,a)})),syncTasks:tasks=>set(s=>{let snap=s.snapshot;for(const t of tasks)snap=reducer.task(snap,{agentId:t.assignedAgentId||t.assignedRole,role:t.assignedRole,label:t.title,status:t.status,progress:t.status==="done"?100:t.status==="working"?60:t.status==="queued"?20:null});return {snapshot:snap};}),reset:()=>set({snapshot:reducer.initial()})}));
