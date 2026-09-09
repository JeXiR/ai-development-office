import {PluginRegistry} from "../src/plugins/registry";
const registry=new PluginRegistry();
const rows=registry.discover(process.cwd());
if(!rows.some(x=>x.manifest.id==="example-hello"))throw new Error("example plugin not discovered");
console.log("Plugin smoke PASS");
