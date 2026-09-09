"use client";
import {useMemo,useState} from "react";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {useUxStore} from "@/store/useUxStore";
import {useOfficeStore} from "@/store/useOfficeStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function WorkspaceSearchPanel(){
  const {t}=useOfficeI18n();
  const files=useWorkspaceStore(s=>s.files);
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const [query,setQuery]=useState("");
  const openTab=useUxStore(s=>s.openTab);

  const results=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return [];
    return files
      .filter(x=>x.type==="file")
      .filter(x=>String(x.relativePath||x.name||"").toLowerCase().includes(q))
      .slice(0,40);
  },[files,query]);

  return <section className="workspace-search-panel">
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("ux.searchFiles")}/>
    <div>{results.map((r:any)=><button key={r.relativePath||r.path} onClick={()=>{
      openTab({id:`file:${r.relativePath}`,kind:"file",title:r.name||r.relativePath,resource:r.relativePath,pinned:false});
      if(projectId)send({action:"workspace_read",project_id:projectId,path:r.relativePath});
    }}><strong>{r.name||r.relativePath}</strong><small>{r.relativePath}</small></button>)}</div>
  </section>;
}