import type {RuntimeProvider} from "../types";
import {ProviderRegistry} from "@/providers/registry";

const registry=new ProviderRegistry();

export function providerAdapter(id:RuntimeProvider){
  const definition=registry.get(id);
  return {
    id,
    displayName:definition?.displayName||id,
    buildArgs:()=>[...(definition?.defaultArgs||[])]
  };
}
