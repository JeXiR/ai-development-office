import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createIntegrityManifest,isIntegrityExcluded,verifyIntegrityManifest,writeIntegrityManifest} from "../src/release/package-integrity";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-integrity-"));
fs.writeFileSync(path.join(temp,"keep.ts"),"export const n=1;\n","utf8");
fs.writeFileSync(path.join(temp,".env.local"),"SECRET=1\n","utf8");
fs.mkdirSync(path.join(temp,"updates"),{recursive:true});
fs.writeFileSync(path.join(temp,"updates","staged.txt"),"nope\n","utf8");

const manifest=createIntegrityManifest(temp,"2.1.9");
if(manifest.files.some(f=>isIntegrityExcluded(f.path)||f.path===".env.local"||f.path.startsWith("updates/"))){
  throw new Error("volatile files leaked into integrity manifest");
}
if(!manifest.files.some(f=>f.path==="keep.ts"))throw new Error("source file missing from manifest");

writeIntegrityManifest(temp,"2.1.9");
const verified=verifyIntegrityManifest(temp);
if(!verified.ok)throw new Error(verified.issues.join("\n"));

fs.writeFileSync(path.join(temp,"keep.ts"),"export const n=2;\n","utf8");
const broken=verifyIntegrityManifest(temp);
if(broken.ok||!broken.issues.some(x=>x.startsWith("checksum mismatch: keep.ts"))){
  throw new Error("checksum mismatch was not detected");
}

console.log("Package integrity smoke PASS");
