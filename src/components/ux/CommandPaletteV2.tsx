"use client";
import {useEffect,useMemo} from "react";
import {useUxStore} from "@/store/useUxStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

const defaults=[
  {id:"office",label:"Office",description:"Pixel Office",keywords:["office","agents"],action:"office"},
  {id:"workspace",label:"Workspace",description:"Editor / Files",keywords:["workspace","editor","files"],action:"workspace"},
  {id:"collaboration",label:"Collaboration",description:"Director / mailbox / DAG",keywords:["collaboration","director"],action:"collaboration"},
  {id:"projects",label:"Projects",description:"Portfolio & registry",keywords:["projects","portfolio"],action:"projects"},
  {id:"tasks",label:"Tasks",description:"Execution & gates",keywords:["tasks","queue"],action:"tasks"},
  {id:"release",label:"Release",description:"Release / Git",keywords:["release","git"],action:"release"},
  {id:"settings",label:"Settings",description:"Settings / Providers / Memory",keywords:["settings","providers","memory"],action:"settings"}
];

export function CommandPaletteV2(){
  const {t}=useOfficeI18n();
  const open=useUxStore(s=>s.paletteOpen);
  const query=useUxStore(s=>s.paletteQuery);
  const entries=useUxStore(s=>s.paletteEntries);
  const setOpen=useUxStore(s=>s.setPaletteOpen);
  const setQuery=useUxStore(s=>s.setPaletteQuery);
  const setEntries=useUxStore(s=>s.setPaletteEntries);

  useEffect(()=>{if(!entries.length)setEntries(defaults);},[entries.length,setEntries]);

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.key==="Escape"&&open)setOpen(false);
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[open,setOpen]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return entries;
    return entries.filter(x=>(`${x.label} ${x.description} ${x.keywords.join(" ")}`).toLowerCase().includes(q));
  },[entries,query]);

  if(!open)return null;
  return <div className="palette-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
    <section className="command-palette-v2">
      <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("ux.searchCommands")}/>
      <div>
        {filtered.map(x=><button key={x.id} onClick={()=>{
          window.dispatchEvent(new CustomEvent("office-command-palette",{detail:{action:x.action}}));
          setOpen(false);
        }}><strong>{x.label}</strong><small>{x.description}</small></button>)}
        {!filtered.length?<p>{t("ux.noCommands")}</p>:null}
      </div>
    </section>
  </div>;
}