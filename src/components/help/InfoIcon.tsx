"use client";

import {useEffect,useId,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {helpFor} from "@/help/helpRegistry";
import {currentHelpLanguage,helpSectionLabels} from "@/help/helpI18n";
import {clampHelpPopover} from "@/help/helpPopover";

type Props={
  label:string;
  kind?:"button"|"checkbox"|"input"|"select"|"heading"|"status";
};

let activeHelpId:string|null=null;
const HELP_EVENT="office-help-open";

export function InfoIcon({label,kind="button"}:Props){
  const id=useId();
  const lang=currentHelpLanguage();
  const help=helpFor(label,kind,lang);
  const labels=helpSectionLabels(lang);
  const [open,setOpen]=useState(false);
  const buttonRef=useRef<HTMLButtonElement|null>(null);
  const popoverRef=useRef<HTMLSpanElement|null>(null);

  useEffect(()=>{
    const closeOther=(event:Event)=>{
      const detail=(event as CustomEvent<string>).detail;
      if(detail!==id)setOpen(false);
    };
    window.addEventListener(HELP_EVENT,closeOther);
    const outside=(event:PointerEvent)=>{
      if(!open)return;
      const target=event.target as Node|null;
      if(buttonRef.current?.contains(target)||popoverRef.current?.contains(target))return;
      setOpen(false);
    };
    document.addEventListener("pointerdown",outside,true);
    return()=>{
      window.removeEventListener(HELP_EVENT,closeOther);
      document.removeEventListener("pointerdown",outside,true);
    };
  },[id,open]);

  useLayoutEffect(()=>{
    if(!open||!buttonRef.current||!popoverRef.current)return;
    clampHelpPopover(buttonRef.current,popoverRef.current);
    const onMove=()=>{
      if(buttonRef.current&&popoverRef.current)clampHelpPopover(buttonRef.current,popoverRef.current);
    };
    window.addEventListener("resize",onMove);
    window.addEventListener("scroll",onMove,true);
    return()=>{
      window.removeEventListener("resize",onMove);
      window.removeEventListener("scroll",onMove,true);
    };
  },[open,help.title,help.purpose]);

  const toggle=()=>{
    const next=!open;
    if(next){
      activeHelpId=id;
      window.dispatchEvent(new CustomEvent(HELP_EVENT,{detail:id}));
    }else if(activeHelpId===id)activeHelpId=null;
    setOpen(next);
  };

  return <span className={`info-help info-help-${kind}`} data-open={open?"true":"false"}>
    <button
      ref={buttonRef}
      type="button"
      className="info-help-trigger"
      aria-label={`${labels.what}: ${help.title}`}
      aria-expanded={open}
      onClick={event=>{event.stopPropagation();toggle();}}
      data-no-help
    >i</button>
    {open&&typeof document!=="undefined"?createPortal(
      <span ref={popoverRef} className="info-help-popover info-help-floating" role="tooltip">
        <strong>{help.title}</strong>
        <span><b>{labels.what}</b>{help.purpose}</span>
        <span><b>{labels.how}</b>{help.how}</span>
        {help.impact?<span><b>{labels.impact}</b>{help.impact}</span>:null}
      </span>,
      document.body
    ):null}
  </span>;
}
