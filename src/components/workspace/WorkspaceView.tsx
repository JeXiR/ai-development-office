"use client";
import { WorkspaceSearchPanel } from "./WorkspaceSearchPanel";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { SplitEditorShell } from "./SplitEditorShell";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { LiveTerminal } from "./LiveTerminal";
import { GitDiffViewer } from "./GitDiffViewer";

export function WorkspaceView(){
  return <div className="workspace-shell">
    <WorkspaceSearchPanel/>
    <WorkspaceTabs/>
    <SplitEditorShell/>
    <div className="workspace-top"><FileExplorer/><CodeEditor/></div>
    <div className="workspace-bottom"><LiveTerminal/><GitDiffViewer/></div>
  </div>;
}
