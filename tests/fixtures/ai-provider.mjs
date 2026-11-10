const original=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url.startsWith('https://openrouter.ai/')){
  const body=JSON.parse(options.body);
  if(JSON.stringify(body).includes('PRIVATE CONTENT'))throw new Error('Private context');
  const question=JSON.parse(body.messages[1].content).question;
  if(question.includes('failure'))return new Response('{}',{status:429});
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Public metadata describes photographs.',citations:[{id:'S1',quote:'Photographs of mountains.'}]})}}]});
 }
 if(!url.startsWith('http://127.0.0.1')&&!url.startsWith('http://localhost'))throw new Error('External network blocked in E2E');
 return original(input,options);
};
