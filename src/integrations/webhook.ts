export type WebhookPayload={
  event:string;
  projectId:string;
  data:unknown;
  createdAt:string;
};

export async function postWebhook(endpoint:string,payload:WebhookPayload,token?:string|null){
  const headers:Record<string,string>={"content-type":"application/json"};
  if(token)headers.authorization=`Bearer ${token}`;
  const response=await fetch(endpoint,{
    method:"POST",
    headers,
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(10000)
  });
  const text=await response.text();
  return {ok:response.ok,status:response.status,body:text.slice(0,2000)};
}
