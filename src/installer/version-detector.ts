import fs from "node:fs";
import path from "node:path";

export class VersionDetector{
  current(officeRoot:string){
    const packageFile=path.join(officeRoot,"package.json");
    const manifestFile=path.join(officeRoot,"office.manifest.json");
    const pkg=fs.existsSync(packageFile)?JSON.parse(fs.readFileSync(packageFile,"utf8")):{};
    const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,"utf8")):{};
    return {
      packageVersion:String(pkg.version||"unknown"),
      manifestVersion:String(manifest.version||"unknown"),
      consistent:String(pkg.version||"")===String(manifest.version||"")
    };
  }
}
