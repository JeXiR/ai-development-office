import {create} from "zustand";

type ProjectDocsState={
  byProject:Record<string,any>;
  busyProjectId:string|null;
  setSnapshot:(projectId:string,data:any)=>void;
  setBusy:(projectId:string|null)=>void;
};

export const useProjectDocsStore=create<ProjectDocsState>((set)=>({
  byProject:{},
  busyProjectId:null,
  setSnapshot:(projectId,data)=>set(state=>({
    byProject:{...state.byProject,[projectId]:data},
    busyProjectId:state.busyProjectId===projectId?null:state.busyProjectId
  })),
  setBusy:(projectId)=>set({busyProjectId:projectId})
}));
