"use client";
import {useEffect,useRef} from "react";
import {createPortal} from "react-dom";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function TerminalModal({open,onClose}:{open:boolean;onClose:()=>void}){
  const {t}=useOfficeI18n();
  const selected=useWorkspaceStore(s=>s.selectedRuntimeSessionId);
  const sessions=useWorkspaceStore(s=>s.runtimeSessions);
  const output=useWorkspaceStore(s=>selected?s.runtimeOutput[selected]||"":"");
  const host=useRef<HTMLDivElement|null>(null);
  const terminalRef=useRef<any>(null);
  const last=useRef("");
  const session=sessions.find(s=>s.id===selected)||null;

  useEffect(()=>{
    if(!open||!host.current||typeof window==="undefined")return;
    let disposed=false;
    let cleanup=()=>{};

    (async()=>{
      const [{Terminal},{FitAddon}]=await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit")
      ]);
      if(disposed||!host.current)return;

      const terminal=new Terminal({convertEol:true,fontSize:12,cursorBlink:true,scrollback:6000});
      const fit=new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(host.current);
      fit.fit();
      terminal.onData(data=>selected&&send({action:"runtime_write",session_id:selected,data}));
      terminalRef.current=terminal;

      const resize=()=>fit.fit();
      window.addEventListener("resize",resize);
      cleanup=()=>{
        window.removeEventListener("resize",resize);
        terminal.dispose();
        terminalRef.current=null;
        last.current="";
      };
    })().catch(error=>console.error("TerminalModal load failed",error));

    return()=>{
      disposed=true;
      cleanup();
    };
  },[open,selected]);

  useEffect(()=>{
    const terminal=terminalRef.current;
    if(!terminal||!open)return;
    if(!output.startsWith(last.current)){terminal.reset();terminal.write(output);}
    else terminal.write(output.slice(last.current.length));
    last.current=output;
  },[output,open]);

  if(!open)return null;
  const dialog=<div className="terminal-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className="terminal-modal">
      <header>
        <div><strong>{session?.agentId||t("pixel.agentTerminal")}</strong><span>{session?`${session.provider} · ${session.status}`:t("pixel.noSession")}</span></div>
        <div>
          <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_pause",session_id:selected})}>{t("workspace.pause")}</button>
          <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_resume",session_id:selected})}>{t("workspace.resume")}</button>
          <button disabled={!selected} onClick={()=>selected&&send({action:"runtime_terminate",session_id:selected})}>{t("workspace.terminate")}</button>
          <button onClick={onClose}>{t("common.close")}</button>
        </div>
      </header>
      <div ref={host} className="terminal-modal-host"/>
    </section>
  </div>;
  if(typeof document==="undefined")return dialog;
  return createPortal(dialog,document.body);
}
