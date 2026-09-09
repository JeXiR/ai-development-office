import {PrerequisiteDetector} from "@/installer/prerequisites";
import {VersionDetector} from "@/installer/version-detector";
import {desktopRuntimeInfo} from "./runtime";

export class FirstRunDiagnostics{
  run(officeRoot:string){
    const prereqs=new PrerequisiteDetector().check();
    const version=new VersionDetector().current(officeRoot);
    return {
      runtime:desktopRuntimeInfo(),
      version,
      prerequisites:prereqs,
      ready:version.consistent&&prereqs.filter(x=>["node","npm","git"].includes(x.id)).every(x=>x.status==="detected")
    };
  }
}
