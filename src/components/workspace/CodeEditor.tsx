"use client";
import {useEffect} from "react";
import Editor from "@monaco-editor/react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {useUxStore} from "@/store/useUxStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function CodeEditor(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const connected=useOfficeStore(s=>s.connected);
  const active=useWorkspaceStore(s=>s.activeFile);
  const dirty=useWorkspaceStore(s=>s.dirtyContent);
  const fileError=useWorkspaceStore(s=>s.fileError);
  const pendingPath=useWorkspaceStore(s=>s.pendingPath);
  const setDirty=useWorkspaceStore(s=>s.setDirtyContent);
  const setPendingPath=useWorkspaceStore(s=>s.setPendingPath);
  const tabs=useUxStore(s=>s.tabs);
  const activeTabId=useUxStore(s=>s.activeTabId);

  useEffect(()=>{
    if(!projectId||!connected)return;
    const tab=tabs.find(x=>x.id===activeTabId);
    const resource=tab?.kind==="file"?tab.resource:null;
    if(!resource||active?.relativePath===resource)return;
    setPendingPath(resource);
    sendOffice({action:"workspace_read",project_id:projectId,path:resource});
    const retry=window.setInterval(()=>{
      if(useWorkspaceStore.getState().activeFile?.relativePath===resource)return;
      sendOffice({action:"workspace_read",project_id:projectId,path:resource});
    },1200);
    const timeout=window.setTimeout(()=>{
      const state=useWorkspaceStore.getState();
      if(state.activeFile?.relativePath===resource||state.fileError)return;
      state.setFileError("The file did not open. The bridge may have dropped the request — try again.");
    },8000);
    return()=>{window.clearInterval(retry);window.clearTimeout(timeout);};
  },[projectId,connected,activeTabId,tabs,active?.relativePath,setPendingPath]);

  const retryOpen=()=>{
    const tab=tabs.find(x=>x.id===activeTabId);
    const resource=tab?.kind==="file"?tab.resource:pendingPath;
    if(!projectId||!resource)return;
    setPendingPath(resource);
    sendOffice({action:"workspace_read",project_id:projectId,path:resource});
  };

  const save=()=>projectId&&active&&dirty!==null&&sendOffice({action:"workspace_write",project_id:projectId,path:active.relativePath,content:dirty});
  const shown=active?.relativePath||pendingPath||t("workspace.selectFile");

  return <section className="workspace-pane code-editor">
    <header>
      <strong>{shown}</strong>
      <div>
        <button disabled={!active} onClick={()=>active&&setDirty(active.content)}>{t("workspace.revert")}</button>
        <button disabled={!active||dirty===active.content} onClick={save}>{t("common.save")}</button>
      </div>
    </header>
    <div className="editor-body">
      {active
        ? <Editor height="100%" theme="vs-dark" language={active.language} path={active.relativePath} value={dirty??active.content} onChange={v=>setDirty(v??"")} options={{fontSize:13,minimap:{enabled:false},automaticLayout:true,scrollBeyondLastLine:false}}/>
        : <div className="workspace-empty">{fileError||(pendingPath?"Opening file…":t("workspace.chooseFile"))}{fileError?<div><button onClick={retryOpen}>{t("common.retry")||"Retry"}</button></div>:null}</div>}
    </div>
  </section>;
}
