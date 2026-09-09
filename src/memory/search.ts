import type {MemoryRecord,MemorySearchResult} from "./types";

const STOPWORDS=new Set(["the","a","an","and","or","to","of","in","on","for","with","is","are","be","this","that","it","as","at","by","from"]);

function terms(text:string){
  return [...new Set(
    text.toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}_-]+/gu," ")
      .split(/\s+/)
      .filter(x=>x.length>1&&!STOPWORDS.has(x))
  )];
}

function scoreMemory(memory:MemoryRecord,queryTerms:string[]){
  const haystack=`${memory.title} ${memory.body} ${memory.tags.join(" ")} ${memory.kind}`.toLowerCase();
  let score=0;
  const matched:string[]=[];
  for(const term of queryTerms){
    if(haystack.includes(term)){
      matched.push(term);
      score+=memory.title.toLowerCase().includes(term)?4:2;
      if(memory.tags.some(tag=>tag.toLowerCase().includes(term)))score+=2;
    }
  }
  score+=Math.min(3,memory.importance/34);
  score+=Math.min(2,(memory.accessCount||0)/5);
  return {score,matched};
}

export class MemorySearchEngine{
  search(memories:MemoryRecord[],query:string,limit=12):MemorySearchResult[]{
    const q=terms(query);
    if(!q.length)return [];
    return memories
      .map(memory=>{
        const {score,matched}=scoreMemory(memory,q);
        return {memory,score,matchedTerms:matched};
      })
      .filter(x=>x.matchedTerms.length>0)
      .sort((a,b)=>b.score-a.score||b.memory.updatedAt.localeCompare(a.memory.updatedAt))
      .slice(0,Math.max(1,Math.min(50,limit)));
  }
}
