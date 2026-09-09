"use client";

import {useEffect} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {getOfficeSocket} from "@/hooks/useOfficeSocket";

export function useWhenOfficeConnected(effect:()=>void|(()=>void),deps:unknown[]=[]){
  const connected=useOfficeStore(s=>s.connected);
  useEffect(()=>{
    if(!connected||!getOfficeSocket())return;
    return effect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[connected,...deps]);
  return connected;
}
