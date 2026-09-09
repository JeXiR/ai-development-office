import fs from "node:fs";
import path from "node:path";

export type ConflictSuggestion={
  path:string;
  ours:string;
  theirs:string;
  base:string|null;
  strategy:"ours"|"theirs"|"manual";
  reason:string;
};

export class MergeConflictAssistant{
  inspect(projectPath:string,file:string):ConflictSuggestion{
    const absolute=path.join(projectPath,file);
    const text=fs.existsSync(absolute)?fs.readFileSync(absolute,"utf8"):"";
    const match=text.match(/<<<<<<<[^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>[^\n]*(?:\n|$)/);
    if(!match)return {path:file,ours:text,theirs:"",base:null,strategy:"manual",reason:"No standard conflict markers found."};
    const ours=match[1].trimEnd(),theirs=match[2].trimEnd();
    if(ours===theirs)return {path:file,ours,theirs,base:null,strategy:"ours",reason:"Both sides are identical."};
    if(!ours.trim())return {path:file,ours,theirs,base:null,strategy:"theirs",reason:"Ours side is empty."};
    if(!theirs.trim())return {path:file,ours,theirs,base:null,strategy:"ours",reason:"Theirs side is empty."};
    return {path:file,ours,theirs,base:null,strategy:"manual",reason:"Both sides contain distinct changes; manual review required."};
  }
}
