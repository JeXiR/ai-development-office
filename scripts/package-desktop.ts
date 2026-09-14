import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {bundledNodePath} from "../desktop/bundled-node";
import {codesignGuide,signDesktopBundle} from "../desktop/codesign";

const root=process.cwd();
const out=path.join(root,"dist","office-desktop");

function write(file:string, text:string){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,text.replace(/\n/g, os.EOL));
}

fs.mkdirSync(out,{recursive:true});

write(path.join(out,"office-launch.cmd"), `@echo off
setlocal
cd /d "%~dp0"
if exist "runtime\\node\\node.exe" set OFFICE_BUNDLED_NODE=%~dp0runtime\\node\\node.exe
if defined OFFICE_BUNDLED_NODE (
  "%OFFICE_BUNDLED_NODE%" --import tsx desktop\\runtime.ts
) else (
  call office-desktop.cmd
)
`);

write(path.join(out,"office-launch.sh"), `#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -x runtime/node/bin/node ]; then
  export OFFICE_BUNDLED_NODE="$PWD/runtime/node/bin/node"
  exec "$OFFICE_BUNDLED_NODE" --import tsx desktop/runtime.ts
fi
exec ./office-desktop.sh
`);

write(path.join(out,"README.md"), `# Office desktop bundle

This folder is the one-click layout. Copy it with scripts/windows/install-office.ps1.

- Put official Node into runtime/node so the user does not need a system Node.
- office-launch.cmd / office-launch.sh start the bundled runtime.
- Without a signing cert the package stays unsigned (SmartScreen / Gatekeeper warnings).
`);

const signed=signDesktopBundle(out);
write(path.join(out,"CODESIGN.md"), `${codesignGuide()}\nLast attempt: ${signed.signed?"signed":"unsigned"}. ${signed.reason}\n`);
const node=bundledNodePath(root);
console.log(`Desktop package layout written to ${out}`);
console.log(`Bundled node: ${node||"not present — installer can download portable Node"}`);
console.log(`Codesign: ${signed.signed?"signed":"unsigned"} — ${signed.reason}`);
