import type {PluginManifestV2,PluginRuntimeState} from "./types";

export function resolvePluginContributions(manifests:PluginManifestV2[],states:PluginRuntimeState[]){
  const enabled=new Set(states.filter(x=>x.enabled).map(x=>x.id));
  const rows=manifests.filter(m=>enabled.has(m.id));
  return {
    providers:rows.flatMap(m=>(m.contributes?.providers||[]).map(x=>({...x,pluginId:m.id}))),
    tools:rows.flatMap(m=>(m.contributes?.tools||[]).map(x=>({...x,pluginId:m.id}))),
    triggers:rows.flatMap(m=>(m.contributes?.triggers||[]).map(x=>({...x,pluginId:m.id}))),
    panels:rows.flatMap(m=>(m.contributes?.panels||[]).map(x=>({...x,pluginId:m.id})))
  };
}
