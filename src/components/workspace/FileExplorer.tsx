"use client";
import {useEffect,useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {useUxStore} from "@/store/useUxStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function FileExplorer(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const connected=useOfficeStore(s=>s.connected);
  const files=useWorkspaceStore(s=>s.files);
  const active=useWorkspaceStore(s=>s.activeFile?.relativePath||null);
  const [cwd,setCwd]=useState("");

  useEffect(()=>{
    if(!projectId||!connected)return;
    sendOffice({action:"workspace_list",project_id:projectId,path:cwd,depth:1});
    sendOffice({action:"workspace_watch",project_id:projectId});
    return()=>sendOffice({action:"workspace_unwatch",project_id:projectId});
  },[projectId,cwd,connected]);

  const parent=cwd.includes("/")?cwd.slice(0,cwd.lastIndexOf("/")):"";

  return <section className="workspace-pane file-explorer">
    <header>
      <strong>{t("workspace.files")}</strong>
      <button onClick={()=>projectId&&sendOffice({action:"workspace_list",project_id:projectId,path:cwd,depth:1})}>{t("common.refresh")}</button>
    </header>
    <div className="file-tree">
      {cwd?<button className="directory" onClick={()=>setCwd(parent)}><span>◂</span><em>..</em></button>:null}
      {files.map(f=><button
        key={f.relativePath}
        className={`${f.type} ${active===f.relativePath?"active":""}`}
        onClick={()=>{
          if(!projectId)return;
          if(f.type==="directory")setCwd(f.relativePath);
          else {
            useWorkspaceStore.getState().setPendingPath(f.relativePath);
            useUxStore.getState().openTab({id:`file:${f.relativePath}`,kind:"file",title:f.name,resource:f.relativePath,pinned:false});
            sendOffice({action:"workspace_read",project_id:projectId,path:f.relativePath});
          }
        }}
      ><span>{f.type==="directory"?"▸":"•"}</span><em>{f.name}</em></button>)}
    </div>
  </section>;
}
