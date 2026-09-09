import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {LedgerStore} from "../src/ledger/store";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-ledger-"));
const store=new LedgerStore();
store.add("p1",temp,{
  provider:"codex",agentId:"backend",taskId:"t1",sessionId:"s1",
  inputTokens:100,outputTokens:50,estimatedCostUsd:0.01,latencyMs:250,durationMs:1000
});
const summary=store.summary(temp);
if(summary.entries!==1||summary.totalTokens!==150)throw new Error("ledger summary failed");
console.log("Ledger smoke PASS");
