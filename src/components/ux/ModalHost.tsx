"use client";
import {useUxStore} from "@/store/useUxStore";

export function ModalHost(){
  const modal=useUxStore(s=>s.modal);
  const setModal=useUxStore(s=>s.setModal);
  if(!modal)return null;

  return <div className="office-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}>
    <section className="office-modal">
      <h3>{modal.title}</h3>
      <p>{modal.body}</p>
      <div>
        {modal.cancelLabel?<button onClick={()=>setModal(null)}>{modal.cancelLabel}</button>:null}
        {modal.confirmLabel?<button className="primary" onClick={()=>setModal(null)}>{modal.confirmLabel}</button>:null}
      </div>
    </section>
  </div>;
}
