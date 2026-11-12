const original=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url.startsWith('https://generativelanguage.googleapis.com/')){
  const body=JSON.parse(options.body);
  if(JSON.stringify(body).includes('PRIVATE CONTENT'))throw new Error('Private context');
  const input=JSON.parse(body.contents[0].parts[0].text);
  const question=input.question;
  if(question.includes('failure'))return new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED'}}),{status:429,headers:{'Retry-After':'0'}});
  if(/catalogue|catalog/i.test(question)){
   const source=input.untrustedPublicMetadata.find(item=>item.id.startsWith('R'));
   return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Use the catalogue search and filters.',citations:[{id:source.id,quote:source.description}]})}]}}]});
  }
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Public metadata describes photographs.',citations:[{id:'S1',quote:'Photographs of mountains.'}]})}]}}]});
 }
 if(!url.startsWith('http://127.0.0.1')&&!url.startsWith('http://localhost'))throw new Error('External network blocked in E2E');
 return original(input,options);
};
