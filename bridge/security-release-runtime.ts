import {securityReadiness} from "../src/security/security-readiness";
import {upgradeCompatibility} from "./recovery-runtime";

export function rcSecuritySnapshot(){
  return {
    security:securityReadiness(process.cwd()),
    compatibility:upgradeCompatibility()
  };
}
