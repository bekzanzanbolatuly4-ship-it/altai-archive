export function sameOriginFailure(request:Request):Response|null{
 const origin=request.headers.get('origin');
 const fetchSite=request.headers.get('sec-fetch-site');
 const production=process.env.NODE_ENV==='production';
 if(fetchSite==='cross-site'){
  return Response.json({error:'Cross-origin request denied'},{status:403});
 }

 const configuredOrigin=process.env.APP_ORIGIN?.trim();
 if(production&&!configuredOrigin){
  return Response.json({error:'Origin validation is not configured'},{status:503});
 }

 let expectedOrigin:string;
 try{
  if(configuredOrigin){
   const configuredUrl=new URL(configuredOrigin);
   if(configuredUrl.pathname!=='/'||configuredUrl.search||configuredUrl.hash||configuredUrl.username||configuredUrl.password){
    throw new Error('APP_ORIGIN must be an origin');
   }
   if(production&&configuredUrl.protocol!=='https:'){
    throw new Error('APP_ORIGIN must use HTTPS in production');
   }
   expectedOrigin=configuredUrl.origin;
  }else{
   expectedOrigin=new URL(request.url).origin;
  }
 }catch{
  return Response.json({error:'Origin validation is not configured'},{status:503});
 }

 if(!origin){
  if(!production&&fetchSite==='same-origin')return null;
  return Response.json({error:'Origin required'},{status:403});
 }

 try{
  const originUrl=new URL(origin);
  if(originUrl.origin===expectedOrigin)return null;
  if(!production&&!configuredOrigin&&fetchSite==='same-origin')return null;
 }catch{}
 return Response.json({error:'Cross-origin request denied'},{status:403});
}
