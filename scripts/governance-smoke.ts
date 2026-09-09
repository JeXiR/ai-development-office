import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {GovernanceStore} from "../src/governance/store";
import {GovernanceAuthorization} from "../src/governance/authorization";
import {GovernanceAuditChain} from "../src/governance/audit-chain";
import {ReleaseGovernanceService} from "../src/governance/release-governance";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-governance-"));
const store=new GovernanceStore();
const policy=store.policy("p1",temp);
if(policy.requiredApprovals.release<1)throw new Error("default policy failed");

store.upsertMember(temp,{id:"owner",displayName:"Owner",role:"owner"});
new GovernanceAuthorization().assert(policy,"owner","release");

const evidence=store.addEvidence("p1",temp,{type:"test",label:"automated regression",status:"pass",source:"smoke"});
if(!evidence.id)throw new Error("evidence failed");

const decision=store.createDecision("p1",temp,{title:"Use stable gate",rationale:"Govern releases",proposedBy:"owner",evidenceIds:[evidence.id]});
store.decideDecision(temp,decision.id,"owner",true);
if(store.decisions(temp)[0].status!=="approved")throw new Error("decision approval failed");

const audit=new GovernanceAuditChain();
audit.append(temp,"owner","decision.approve",{decisionId:decision.id});
audit.append(temp,"owner","evidence.add",{evidenceId:evidence.id});
const verified=audit.verify(temp);
if(!verified.ok||verified.count!==2)throw new Error("audit chain failed");

const evalUnlocked=new ReleaseGovernanceService(store).evaluate("p1",temp,true);
if(!evalUnlocked.eligible)throw new Error("release governance should be eligible");

const signoff=store.createSignoff("p1",temp,{version:"2.0.0",requestedBy:"owner",requiredApprovals:1,evidenceIds:[evidence.id],blockers:[]});
store.approveSignoff(temp,signoff.id,"owner");
if(store.signoffs(temp)[0].status!=="approved")throw new Error("signoff approval failed");

console.log("Governance smoke PASS");
