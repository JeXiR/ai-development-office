import {parseOfficeUiLanguage} from "../src/help/helpI18n";

if(parseOfficeUiLanguage("tr")!=="tr")throw new Error("tr not parsed");
if(parseOfficeUiLanguage("en")!=="en")throw new Error("en not parsed");
if(parseOfficeUiLanguage("de")!=="de")throw new Error("de not parsed");
if(parseOfficeUiLanguage("ru")!=="ru")throw new Error("ru not parsed");
if(parseOfficeUiLanguage("fr")!==null)throw new Error("unknown language leaked");
if(parseOfficeUiLanguage("")!==null)throw new Error("empty language leaked");

console.log("UI language smoke PASS");
