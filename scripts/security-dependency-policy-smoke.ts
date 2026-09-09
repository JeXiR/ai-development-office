import fs from "node:fs";
import path from "node:path";

const pkg=JSON.parse(fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8"));
const nextVersion=String(pkg.dependencies?.next||pkg.devDependencies?.next||"");
const override=String(pkg.overrides?.postcss||"");

if(nextVersion!=="^15.2.0") throw new Error(`Unexpected Next version: ${nextVersion}`);
if(override!=="8.5.28") throw new Error(`PostCSS security override missing: ${override}`);

console.log("Security Dependency Policy smoke PASS");
console.log(JSON.stringify({next:nextVersion,postcssOverride:override},null,2));
