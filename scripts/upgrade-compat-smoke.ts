import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {StateMigrationService} from "../src/reproducibility/migrations";
import {OFFICE_STATE_SCHEMA_VERSION} from "../src/reproducibility/schema";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-upgrade-"));
const file=path.join(temp,"legacy.json");
fs.writeFileSync(file,JSON.stringify({missions:[],heartbeats:[]}),"utf8");
const svc=new StateMigrationService();
const first=svc.migrateJsonFile(file);
const second=svc.migrateJsonFile(file);
if(first.toVersion!==OFFICE_STATE_SCHEMA_VERSION)throw new Error("upgrade version failed");
if(second.changed)throw new Error("migration must be idempotent");
console.log("Upgrade compatibility smoke PASS");
