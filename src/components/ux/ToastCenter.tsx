"use client";
import {useEffect} from "react";
import {useUxStore} from "@/store/useUxStore";

export function ToastCenter(){
  const toasts=useUxStore(s=>s.toasts);
  const dismiss=useUxStore(s=>s.dismissToast);

  useEffect(()=>{
    const timers=toasts.map(t=>setTimeout(()=>dismiss(t.id),t.timeoutMs));
    return ()=>timers.forEach(clearTimeout);
  },[toasts,dismiss]);

  return <div className="toast-center">
    {toasts.map(t=><article key={t.id} className={`toast ${t.kind}`}>
      <strong>{t.title}</strong><p>{t.message}</p><button onClick={()=>dismiss(t.id)}>×</button>
    </article>)}
  </div>;
}
