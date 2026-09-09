import path from "node:path";
import fs from "node:fs";
import {writeIntegrityManifest,verifyIntegrityManifest} from "../src/release/package-integrity";

const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const result=writeIntegrityManifest(root,String(pkg.version));
const verified=verifyIntegrityManifest(root);
if(!verified.ok){
  console.error(verified.issues);
  process.exit(1);
}
console.log(`Release integrity PASS: ${result.manifest.files.length} files`);
