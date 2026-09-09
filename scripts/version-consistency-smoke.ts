import fs from "node:fs";
import path from "node:path";
import {verifyVersionConsistency} from "../src/release/version-consistency";

const pkg=JSON.parse(fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8"));
const expected=String(pkg.version);
const result=verifyVersionConsistency(process.cwd(),expected);

if(!result.ok){
  console.error(result.issues);
  process.exit(1);
}
console.log(`Version Consistency PASS: ${expected}`);
