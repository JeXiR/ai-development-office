import {CircuitBreaker} from "./circuit-breaker";
import type {SafetyIncident,SafetyPolicy} from "./types";

export class SafetyService{
  readonly breaker:CircuitBreaker;
  private incidents:SafetyIncident[]=[];

  constructor(policy?:Partial<SafetyPolicy>){
    this.breaker=new CircuitBreaker(policy);
  }

  addIncident(incident:SafetyIncident|null){
    if(!incident)return null;
    this.incidents.push(incident);
    this.incidents=this.incidents.slice(-1000);
    return incident;
  }

  list(projectId?:string){
    return this.incidents.filter(x=>!projectId||x.projectId===projectId);
  }

  snapshot(projectId?:string){
    return {
      policy:this.breaker.policy,
      incidents:this.list(projectId)
    };
  }
}
