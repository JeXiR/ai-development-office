import type {GovernancePolicy,GovernanceRole} from "./types";

export class GovernanceAuthorization{
  can(policy:GovernancePolicy,role:GovernanceRole,action:"destructiveAction"|"release"|"policyChange"|"waiver"){
    return (policy.allowedRoles[action]||[]).includes(role);
  }

  assert(policy:GovernancePolicy,role:GovernanceRole,action:"destructiveAction"|"release"|"policyChange"|"waiver"){
    if(!this.can(policy,role,action))throw new Error(`Role ${role} is not authorized for ${action}.`);
  }
}
