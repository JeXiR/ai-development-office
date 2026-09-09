import crypto from "node:crypto";
import {EventEmitter} from "node:events";
import type {UniversalProviderId} from "./types";
import type {NormalizedToolCall,NormalizedUsage} from "./normalized";

export type ProviderStreamEvent=
  |{type:"stream.started";streamId:string;providerId:UniversalProviderId;sessionId:string|null;model:string|null;at:string}
  |{type:"stream.text.delta";streamId:string;providerId:UniversalProviderId;delta:string;at:string}
  |{type:"stream.tool.started";streamId:string;providerId:UniversalProviderId;tool:{id:string;name:string};at:string}
  |{type:"stream.tool.delta";streamId:string;providerId:UniversalProviderId;toolCallId:string;delta:string;at:string}
  |{type:"stream.tool.completed";streamId:string;providerId:UniversalProviderId;tool:NormalizedToolCall;at:string}
  |{type:"stream.usage";streamId:string;providerId:UniversalProviderId;usage:NormalizedUsage;at:string}
  |{type:"stream.completed";streamId:string;providerId:UniversalProviderId;finishReason:string|null;at:string}
  |{type:"stream.cancelled";streamId:string;providerId:UniversalProviderId;at:string}
  |{type:"stream.failed";streamId:string;providerId:UniversalProviderId;error:string;at:string};

export class ProviderStreamBus{
  private emitter=new EventEmitter();
  private controllers=new Map<string,AbortController>();

  create(providerId:UniversalProviderId){
    const streamId=crypto.randomUUID();
    const controller=new AbortController();
    this.controllers.set(streamId,controller);
    return {streamId,controller};
  }

  emit(event:ProviderStreamEvent){this.emitter.emit("event",event);}
  subscribe(listener:(event:ProviderStreamEvent)=>void){
    this.emitter.on("event",listener);
    return()=>this.emitter.off("event",listener);
  }

  cancel(streamId:string){
    const controller=this.controllers.get(streamId);
    if(!controller)return false;
    controller.abort();
    return true;
  }

  close(streamId:string){this.controllers.delete(streamId);}
}
