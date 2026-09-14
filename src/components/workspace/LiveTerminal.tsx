"use client";
import {useEffect,useRef} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function LiveTerminal(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const sessions=useWorkspaceStore(s=>s.runtimeSessions);
  const selected=useWorkspaceStore(s=>s.selectedRuntimeSessionId);
  const select=useWorkspaceStore(s=>s.selectRuntimeSession);
  const output=useWorkspaceStore(s=>selected?s.runtimeOutput[selected]||"":"");
  const host=useRef<HTMLDivElement|null>(null);
  const terminalRef=useRef<any>(null);
  const last=useRef("");

  const spawn=(provider:"cursor"|"claude"|"codex"|"gemini"|"copilot"|"kimi"|"qwen"|"crush"|"pi"|"grok"|"opencode"|"custom"|"local")=>{
    if(!projectId)return;
    send({
      action:"runtime_spawn",
      project_id:projectId,
      provider,
      agent_id:`${provider}-agent`,
      role:"general",
      task:"Interactive development session"
    });
  };

  useEffect(()=>{
    if(!host.current||typeof window==="undefined")return;
    let disposed=false;
    let cleanup=()=>{};

    (async()=>{
      const [{Terminal},{FitAddon}]=await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit")
      ]);
      if(disposed||!host.current)return;

      const terminal=new Terminal({
        convertEol:true,
        fontSize:12,
        cursorBlink:true,
        scrollback:8000
      });
      const fit=new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(host.current);
      fit.fit();

      terminal.onData(data=>{
        if(selected)send({action:"runtime_write",session_id:selected,data});
      });

      terminalRef.current=terminal;
      const resize=()=>fit.fit();
      window.addEventListener("resize",resize);

      cleanup=()=>{
        window.removeEventListener("resize",resize);
        terminal.dispose();
        terminalRef.current=null;
        last.current="";
      };
    })().catch(error=>console.error("LiveTerminal load failed",error));

    return()=>{
      disposed=true;
      cleanup();
    };
  },[selected]);

  useEffect(()=>{
    const terminal=terminalRef.current;
    if(!terminal)return;
    if(!output.startsWith(last.current)){
      terminal.reset();
      terminal.write(output);
    }else{
      terminal.write(output.slice(last.current.length));
    }
    last.current=output;
  },[output]);

  return <section className="workspace-pane live-terminal">
    <header>
      <strong>{t("workspace.liveTerminal")}</strong>
      <div className="terminal-actions">
        <button onClick={()=>spawn("cursor")}>+ Cursor</button>
        <button onClick={()=>spawn("claude")}>+ Claude</button>
        <button onClick={()=>spawn("codex")}>+ Codex</button>
        <button onClick={()=>spawn("gemini")}>+ Gemini</button>
        <button onClick={()=>spawn("copilot")}>+ Copilot</button>
        <button onClick={()=>spawn("kimi")}>+ Kimi</button>
        <button onClick={()=>spawn("qwen")}>+ Qwen</button>
        <button onClick={()=>spawn("crush")}>+ Crush</button>
        <button onClick={()=>spawn("pi")}>+ Pi</button>
        <button onClick={()=>spawn("grok")}>+ Grok</button>
        <button onClick={()=>spawn("custom")}>+ Custom</button>
        <button onClick={()=>spawn("opencode")}>+ OpenCode</button>
        <button onClick={()=>spawn("local")}>+ Local</button>
      </div>
    </header>

    <div className="terminal-session-bar">
      <select value={selected||""} onChange={e=>select(e.target.value||null)}>
        <option value="">{t("workspace.selectSession")}</option>
        {sessions.map(s=><option key={s.id} value={s.id}>{s.agentId} · {s.provider} · {s.status}</option>)}
      </select>
      <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_pause",session_id:selected})}>{t("workspace.pause")}</button>
      <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_resume",session_id:selected})}>{t("workspace.resume")}</button>
      <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_terminate",session_id:selected})}>{t("workspace.terminate")}</button>
    </div>

    <div ref={host} className="terminal-host"/>
  </section>;
}
