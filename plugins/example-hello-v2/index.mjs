export const hooks={
  "office.start":async(ctx,api)=>{
    api.log("office.start received");
    return {message:"hello from example plugin",projectId:ctx.projectId};
  },
  "tool.invoke":async(ctx,api)=>{
    const value=String(ctx.payload?.message||"hello");
    return {echo:value};
  }
};
