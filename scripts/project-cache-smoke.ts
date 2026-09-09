import {pickActiveProjectId,readProjectsCache,writeProjectsCache} from "../src/store/project-cache";

const memory=new Map<string,string>();
const storage={
  getItem(key:string){return memory.get(key)??null;},
  setItem(key:string,value:string){memory.set(key,value);}
};

const empty=readProjectsCache(storage);
if(empty.projects.length||empty.activeProjectId)throw new Error("empty storage should boot empty");

writeProjectsCache([
  {id:"alpha",name:"Alpha",path:"D:\\\\a",enabled:true},
  {id:"beta",name:"Beta",path:"D:\\\\b",enabled:false},
  {id:"",name:"Bad",path:"D:\\\\c",enabled:true}
], "missing", storage);

const cached=readProjectsCache(storage);
if(cached.projects.length!==1||cached.projects[0].id!=="alpha")throw new Error("disabled and invalid rows leaked");
if(cached.activeProjectId!=="alpha")throw new Error("missing preferred id should fall back to first enabled");

writeProjectsCache([
  {id:"callme",name:"CallMe",path:"D:\\\\laragon\\\\www\\\\callme",enabled:true,provider:"auto",runnerTrusted:true},
  {id:"other",name:"Other",path:"D:\\\\other",enabled:true}
], "callme", storage);

const again=readProjectsCache(storage);
if(again.activeProjectId!=="callme")throw new Error("saved active project was not restored");
if(again.projects[0].name!=="CallMe")throw new Error("cached name was lost");

if(pickActiveProjectId(again.projects,"other")!=="other")throw new Error("explicit selection should win");
if(pickActiveProjectId(again.projects,"nope")!=="callme")throw new Error("unknown selection should fall back");

console.log("Project cache smoke PASS");
