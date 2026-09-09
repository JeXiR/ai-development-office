"use client";

import {useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function AccountConnectionsPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<any[]>([]);
  const [loginMessage,setLoginMessage]=useState("");

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="account_connections")setRows(Array.isArray(m.data)?m.data:[]);
        if(m.type==="account_login_started")setLoginMessage(`${m.data?.name||"Account"} login launched. Complete authentication in the browser/CLI window.`);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    send("get_account_connections");
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel account-connections-panel" data-help="account-connections">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("accounts.eyebrow")}</div>
        <h2>{t("accounts.title")}</h2>
      </div>
      <span>{rows.filter(x=>x.authenticated).length}/{rows.length||5} {t("accounts.connected")}</span>
    </div>

    <p className="muted">
      {t("accounts.hint")}
    </p>

    <div className="account-connection-grid">
      {rows.map(row=><article key={row.id} className="account-connection-card">
        <div>
          <strong>{row.name}</strong>
          <span>{row.authenticated?t("accounts.connectedState"):row.installed?t("accounts.readyLogin"):t("accounts.cliMissing")}</span>
        </div>
        <small>{row.accountUsageNotes}</small>
        <small>{row.statusText}</small>
        <div className="skills-toolbar">
          <button disabled={!row.installed} onClick={()=>send("login_account_connection",{id:row.id})}>{t("accounts.login")}</button>
          <button disabled={!row.installed} onClick={()=>send("get_account_connections")}>{t("accounts.refresh")}</button>
        </div>
      </article>)}
    </div>
    {loginMessage?<p className="muted">{loginMessage}</p>:null}
  </section>;
}
