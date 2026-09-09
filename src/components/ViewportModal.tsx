"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export type ModalAnchor={x:number;y:number};

export function modalAnchorFromEvent(event:React.MouseEvent<HTMLElement>):ModalAnchor{
  const rect=event.currentTarget.getBoundingClientRect();
  return {x:Math.round(rect.left+Math.min(rect.width*.65,280)),y:Math.round(rect.top+Math.min(rect.height*.7,150))};
}

function clampStyle(anchor?:ModalAnchor|null,width=760,height=650):React.CSSProperties{
  if(!anchor)return{};
  const margin=16;
  const vw=typeof window!=="undefined"?window.innerWidth:1440;
  const vh=typeof window!=="undefined"?window.innerHeight:900;
  const w=Math.min(width,vw-margin*2);
  const h=Math.min(height,vh-margin*2);
  let left=anchor.x,top=anchor.y;
  if(left+w>vw-margin)left=Math.max(margin,vw-w-margin);
  if(top+h>vh-margin)top=Math.max(margin,vh-h-margin);
  return {position:"fixed",left,top,width:w,maxHeight:h,transform:"none",margin:0};
}

export function ViewportModal({
  children,onClose,anchor,width=760,height=650,className=""
}:{
  children:ReactNode;
  onClose:()=>void;
  anchor?:ModalAnchor|null;
  width?:number;
  height?:number;
  className?:string;
}){
  if(typeof document==="undefined")return null;
  return createPortal(
    <div className="modal-backdrop viewport-modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal-card viewport-modal-card ${className}`}
        style={clampStyle(anchor,width,height)}
        onMouseDown={e=>e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
