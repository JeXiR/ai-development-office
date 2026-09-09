import {integrationFetch} from "./http";

function bearer(token:string|null,extra:Record<string,string>={}){
  const h:Record<string,string>={"content-type":"application/json",...extra};
  if(token)h.authorization=`Bearer ${token}`;
  return h;
}

export class IntegrationActions{
  githubCreateIssue(input:{repo:string;title:string;body?:string;token:string|null},attempt=1){
    return integrationFetch({url:`https://api.github.com/repos/${input.repo}/issues`,method:"POST",
      headers:bearer(input.token,{"accept":"application/vnd.github+json","x-github-api-version":"2022-11-28"}),
      body:{title:input.title,body:input.body||""},attempt});
  }
  githubCreatePullRequest(input:{repo:string;title:string;body?:string;head:string;base:string;token:string|null},attempt=1){
    return integrationFetch({url:`https://api.github.com/repos/${input.repo}/pulls`,method:"POST",
      headers:bearer(input.token,{"accept":"application/vnd.github+json","x-github-api-version":"2022-11-28"}),
      body:{title:input.title,body:input.body||"",head:input.head,base:input.base},attempt});
  }
  gitlabCreateMergeRequest(input:{endpoint:string;projectId:string;title:string;sourceBranch:string;targetBranch:string;token:string|null},attempt=1){
    const headers:Record<string,string>={"content-type":"application/json"};
    if(input.token)headers["PRIVATE-TOKEN"]=input.token;
    return integrationFetch({url:`${input.endpoint.replace(/\/$/,"")}/api/v4/projects/${encodeURIComponent(input.projectId)}/merge_requests`,
      method:"POST",headers,body:{title:input.title,source_branch:input.sourceBranch,target_branch:input.targetBranch},attempt});
  }
  slackPostMessage(input:{channel:string;text:string;token:string|null},attempt=1){
    return integrationFetch({url:"https://slack.com/api/chat.postMessage",method:"POST",headers:bearer(input.token),body:{channel:input.channel,text:input.text},attempt});
  }
  discordWebhook(input:{webhookUrl:string;content:string},attempt=1){
    return integrationFetch({url:input.webhookUrl,method:"POST",headers:{"content-type":"application/json"},body:{content:input.content},attempt});
  }
  jiraCreateIssue(input:{endpoint:string;projectKey:string;summary:string;description?:string;token:string|null},attempt=1){
    return integrationFetch({url:`${input.endpoint.replace(/\/$/,"")}/rest/api/3/issue`,method:"POST",headers:bearer(input.token),
      body:{fields:{project:{key:input.projectKey},summary:input.summary,issuetype:{name:"Task"},description:input.description||""}},attempt});
  }
  linearCreateIssue(input:{teamId:string;title:string;description?:string;token:string|null},attempt=1){
    return integrationFetch({url:"https://api.linear.app/graphql",method:"POST",headers:bearer(input.token),
      body:{query:"mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title } } }",
        variables:{input:{teamId:input.teamId,title:input.title,description:input.description||""}}},attempt});
  }
  notionCreatePage(input:{parentPageId:string;title:string;content?:string;token:string|null},attempt=1){
    return integrationFetch({url:"https://api.notion.com/v1/pages",method:"POST",headers:bearer(input.token,{"Notion-Version":"2022-06-28"}),
      body:{parent:{page_id:input.parentPageId},properties:{title:{title:[{text:{content:input.title}}]}},
        children:input.content?[{object:"block",type:"paragraph",paragraph:{rich_text:[{type:"text",text:{content:input.content}}]}}]:[]},attempt});
  }
  sentryCreateEvent(input:{endpoint:string;org:string;project:string;title:string;message:string;token:string|null},attempt=1){
    return integrationFetch({url:`${input.endpoint.replace(/\/$/,"")}/api/0/projects/${input.org}/${input.project}/events/`,method:"POST",
      headers:bearer(input.token),body:{message:input.message,platform:"other",tags:{source:"ai-development-office"},extra:{title:input.title}},attempt});
  }
  genericWebhook(input:{url:string;payload:unknown;token:string|null},attempt=1){
    return integrationFetch({url:input.url,method:"POST",headers:bearer(input.token),body:input.payload,attempt});
  }
  ciStatus(input:{url:string;token:string|null},attempt=1){
    return integrationFetch({url:input.url,method:"GET",headers:bearer(input.token),attempt});
  }
}
