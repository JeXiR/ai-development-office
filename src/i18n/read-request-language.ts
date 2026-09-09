import {cookies} from "next/headers";
import {OFFICE_LANGUAGE_KEY,parseOfficeUiLanguage,type HelpUiLanguage} from "@/help/helpI18n";

export async function readRequestLanguage():Promise<HelpUiLanguage|undefined>{
  const raw=(await cookies()).get(OFFICE_LANGUAGE_KEY)?.value??null;
  return parseOfficeUiLanguage(raw)??undefined;
}
