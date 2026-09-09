import path from "node:path";
import type {PluginManifestV2,PluginPermission} from "./types";

export class PluginPermissionService{
  has(manifest:PluginManifestV2,permission:PluginPermission){
    return manifest.permissions.includes(permission);
  }

  assert(manifest:PluginManifestV2,permission:PluginPermission){
    if(!this.has(manifest,permission))throw new Error(`Plugin ${manifest.id} lacks permission: ${permission}`);
  }

  resolveProjectPath(projectPath:string,relativePath:string){
    const root=path.resolve(projectPath);
    const target=path.resolve(root,relativePath);
    if(target!==root&&!target.startsWith(root+path.sep))throw new Error("Plugin path escapes project root.");
    return target;
  }
}
