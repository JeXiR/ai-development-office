"use client";
import {useEffect} from "react";
import {helpFor} from "@/help/helpRegistry";
import {currentHelpLanguage,helpSectionLabels,OFFICE_LANGUAGE_EVENT} from "@/help/helpI18n";
import {clampHelpPopover} from "@/help/helpPopover";

type Mounted={host:HTMLElement;popover:HTMLElement;cleanup:()=>void;key:string;title:string};

const mounted=new Map<Element,Mounted>();
let floating:HTMLElement|null=null;

function textOf(el:Element){
  const clone=el.cloneNode(true) as Element;
  clone.querySelectorAll(".info-help-host,[data-help-generated]").forEach(node=>node.remove());
  if(el instanceof HTMLInputElement){
    return el.getAttribute("aria-label")||el.placeholder||el.name||el.id||"Input";
  }
  if(el instanceof HTMLSelectElement){
    return el.getAttribute("aria-label")||el.name||el.id||"Selection";
  }
  return el.getAttribute("aria-label")||el.getAttribute("title")||clone.textContent?.trim()||"Control";
}

function kindOf(el:Element):"button"|"checkbox"|"input"|"select"|"heading"|"status"{
  if(el instanceof HTMLInputElement&&el.type==="checkbox")return "checkbox";
  if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)return "input";
  if(el instanceof HTMLSelectElement)return "select";
  if(/^H[1-6]$/.test(el.tagName))return "heading";
  if(el.matches("[data-status],.eyebrow,.stable-gate-lock"))return "status";
  return "button";
}

function helpKeyOf(el:Element){
  return el.getAttribute("data-help")
    ||el.closest("[data-help]")?.getAttribute("data-help")
    ||textOf(el);
}

function shouldDecorate(el:Element){
  if(el.closest(".info-help,.info-help-popover,.info-help-host"))return false;
  if(el.hasAttribute("data-no-help"))return false;
  if(el.matches("h1,h2,h3"))return true;
  if(el.matches("[data-status]"))return true;
  if(el.matches("button[data-help],input[data-help],select[data-help]"))return true;
  return false;
}

function escapeHtml(value:string){
  return value.replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[char]||char));
}

function closeFloating(){
  if(!floating)return;
  floating.classList.remove("info-help-floating");
  floating.hidden=true;
  const host=floating.closest(".info-help")||document.querySelector(`.info-help [aria-controls="${floating.id}"]`);
  host?.closest(".info-help")?.setAttribute("data-open","false");
  const home=document.querySelector(`[data-help-popover-home="${floating.id}"]`);
  if(home)home.appendChild(floating);
  floating=null;
}

function openPopover(trigger:HTMLElement,popover:HTMLElement,wrap:HTMLElement){
  if(floating&&floating!==popover)closeFloating();
  document.body.appendChild(popover);
  popover.hidden=false;
  wrap.setAttribute("data-open","true");
  clampHelpPopover(trigger,popover);
  floating=popover;
}

function bindPopover(wrap:HTMLElement,trigger:HTMLElement,popover:HTMLElement){
  const toggle=(event:Event)=>{
    event.preventDefault();
    event.stopPropagation();
    if(floating===popover)closeFloating();
    else openPopover(trigger,popover,wrap);
  };
  const onMove=()=>{
    if(floating===popover)clampHelpPopover(trigger,popover);
  };
  trigger.addEventListener("click",toggle);
  window.addEventListener("resize",onMove);
  window.addEventListener("scroll",onMove,true);
  return ()=>{
    trigger.removeEventListener("click",toggle);
    window.removeEventListener("resize",onMove);
    window.removeEventListener("scroll",onMove,true);
  };
}

function isAttached(el:Element,host:HTMLElement){
  if(!host.isConnected)return false;
  return el.contains(host)||el.nextElementSibling===host;
}

function mountFor(el:Element){
  const existing=mounted.get(el);
  const key=helpKeyOf(el);
  const title=textOf(el);
  if(existing){
    if(isAttached(el,existing.host)&&existing.key===key&&existing.title===title)return;
    existing.cleanup();
    try{existing.host.remove();}catch{}
    if(floating===existing.popover)floating=null;
    try{existing.popover.remove();}catch{}
    mounted.delete(el);
  }
  if(!shouldDecorate(el))return;
  const kind=kindOf(el);
  const lang=currentHelpLanguage();
  const help=helpFor(key,kind,lang);
  if(!help?.purpose?.trim())return;
  const labels=helpSectionLabels(lang);
  const popoverId=`help-pop-${Math.random().toString(36).slice(2,9)}`;

  const host=document.createElement("span");
  host.className="info-help-host";
  host.setAttribute("data-help-generated","true");
  host.setAttribute("data-help-popover-home",popoverId);
  host.innerHTML=`<span class="info-help info-help-${kind}">
    <button type="button" class="info-help-trigger" aria-label="${escapeHtml(labels.what)}: ${escapeHtml(help.title)}" aria-controls="${popoverId}" data-no-help>i</button>
    <span id="${popoverId}" class="info-help-popover" role="tooltip" hidden>
      <strong>${escapeHtml(help.title)}</strong>
      <span><b>${escapeHtml(labels.what)}</b>${escapeHtml(help.purpose)}</span>
      <span><b>${escapeHtml(labels.how)}</b>${escapeHtml(help.how)}</span>
      ${help.impact?`<span><b>${escapeHtml(labels.impact)}</b>${escapeHtml(help.impact)}</span>`:""}
    </span>
  </span>`;

  el.insertAdjacentElement("afterend",host);

  const wrap=host.querySelector(".info-help") as HTMLElement;
  const trigger=host.querySelector(".info-help-trigger") as HTMLElement;
  const popover=host.querySelector(".info-help-popover") as HTMLElement;
  const cleanup=bindPopover(wrap,trigger,popover);
  mounted.set(el,{host,popover,cleanup,key,title});
}

function unmountAll(){
  closeFloating();
  for(const {host,popover,cleanup} of mounted.values()){
    cleanup();
    try{host.remove();}catch{}
    try{popover.remove();}catch{}
  }
  mounted.clear();
}

function scan(root:ParentNode=document){
  root.querySelectorAll("h1,h2,h3,[data-status],button[data-help],input[data-help],select[data-help]").forEach(mountFor);
}

export function GlobalContextHelp(){
  useEffect(()=>{
    scan();
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node instanceof Element){
            if(shouldDecorate(node))mountFor(node);
            scan(node);
          }
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    const timer=window.setInterval(()=>scan(),1200);
    const onLang=()=>{unmountAll();scan();};
    const onPointer=(event:PointerEvent)=>{
      if(!floating)return;
      const target=event.target as Node|null;
      if(floating.contains(target))return;
      if((target as Element|null)?.closest?.(".info-help-trigger"))return;
      closeFloating();
    };
    window.addEventListener(OFFICE_LANGUAGE_EVENT,onLang);
    document.addEventListener("pointerdown",onPointer,true);

    return ()=>{
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener(OFFICE_LANGUAGE_EVENT,onLang);
      document.removeEventListener("pointerdown",onPointer,true);
      const pending=[...mounted.values()];
      mounted.clear();
      floating=null;
      window.setTimeout(()=>{
        for(const item of pending){
          item.cleanup();
          try{item.host.remove();}catch{}
          try{item.popover.remove();}catch{}
        }
      },0);
    };
  },[]);
  return null;
}
