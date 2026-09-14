"use client";

import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useSpeechToText} from "@/hooks/useSpeechToText";

type DeskAgent={
  id:string;
  role:string;
  state?:string;
};

export function AgentDeskModal({
  open,
  agent,
  hasSession,
  canAssign,
  onClose,
  onAssign,
  onOpenTerminal
}:{
  open:boolean;
  agent:DeskAgent|null;
  hasSession:boolean;
  canAssign:boolean;
  onClose:()=>void;
  onAssign:(goal:string)=>void;
  onOpenTerminal:()=>void;
}){
  const {t,language}=useOfficeI18n();
  const [draft,setDraft]=useState("");
  const [interim,setInterim]=useState("");
  const speech=useSpeechToText(language);
  const startedThisPress=useRef(false);

  useEffect(()=>{
    if(!open){
      speech.stop();
      setDraft("");
      setInterim("");
    }
  },[open,agent?.id]);

  if(!open||!agent)return null;

  const name=agent.role||agent.id;
  const value=interim?[draft,interim].filter(Boolean).join(" "):draft;
  const ready=Boolean(value.trim())&&canAssign;

  const commitInterim=()=>{
    if(!interim.trim())return;
    setDraft(prev=>[prev.trim(),interim.trim()].filter(Boolean).join(" "));
    setInterim("");
  };

  const dialog=<div className="agent-desk-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){speech.stop();onClose();}}}>
    <section className="agent-desk-modal" role="dialog" aria-modal="true" aria-labelledby="agent-desk-title">
      <header>
        <div>
          <div className="eyebrow">{t("pixel.deskEyebrow")}</div>
          <strong id="agent-desk-title">{t("pixel.deskTitle").replace("{name}",name)}</strong>
          <span>{name} · {t(`office.${agent.state||"idle"}`,agent.state||"idle")}</span>
        </div>
        <button type="button" onClick={()=>{speech.stop();onClose();}}>{t("common.close")}</button>
      </header>

      <p className="muted">{t("pixel.deskHint")}</p>

      <textarea
        className="agent-desk-input"
        rows={5}
        value={value}
        onChange={e=>{
          speech.stop();
          setInterim("");
          setDraft(e.target.value);
        }}
        placeholder={t("pixel.taskPlaceholder")}
      />

      {speech.listening?<small className="agent-desk-speech-status is-live">{t("pixel.speechSpeakNow")}</small>:null}
      {speech.error==="denied"?<small className="agent-desk-speech-status is-error">{t("pixel.speechDenied")}</small>:null}
      {speech.error==="mic"?<small className="agent-desk-speech-status is-error">{t("pixel.speechMic")}</small>:null}
      {speech.error&&speech.error!=="denied"&&speech.error!=="mic"?<small className="agent-desk-speech-status is-error">{t("pixel.speechError")}</small>:null}
      {!speech.supported?<small className="muted">{t("pixel.speechUnsupported")}</small>:null}

      <div className="agent-desk-actions">
        <button
          type="button"
          className={speech.listening?"is-listening":""}
          disabled={!speech.supported}
          onPointerDown={event=>{
            event.preventDefault();
            if(speech.listening)return;
            startedThisPress.current=true;
            speech.start((text,final)=>{
              if(final){
                setDraft(prev=>[prev.trim(),text.trim()].filter(Boolean).join(" "));
                setInterim("");
              }else setInterim(text);
            });
          }}
          onClick={()=>{
            if(startedThisPress.current){
              startedThisPress.current=false;
              return;
            }
            if(!speech.listening)return;
            commitInterim();
            speech.stop();
          }}
        >{speech.listening?t("pixel.listening"):t("pixel.listen")}</button>
        <button type="button" onClick={onOpenTerminal}>{hasSession?t("pixel.openTerminal"):t("pixel.spawnTerminal")}</button>
        <button
          type="button"
          className="primary"
          disabled={!ready}
          onClick={()=>{
            commitInterim();
            const goal=(interim?[draft,interim].filter(Boolean).join(" "):draft).trim();
            if(!goal||!canAssign)return;
            speech.stop();
            onAssign(goal);
          }}
        >{t("pixel.giveTask")}</button>
      </div>
    </section>
  </div>;

  if(typeof document==="undefined")return dialog;
  return createPortal(dialog,document.body);
}
