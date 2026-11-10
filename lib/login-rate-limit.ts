import {createHash} from 'node:crypto';

const attempts=new Map<string,{count:number;until:number}>();
const maxAttempts=8;
const windowMs=15*60_000;

function keyFor(email:string):string{
 return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function isLoginRateLimited(email:string,now=Date.now()):{limited:boolean;retrySeconds:number}{
 const key=keyFor(email);
 const current=attempts.get(key);
 if(!current||current.until<=now){
  attempts.delete(key);
  return {limited:false,retrySeconds:0};
 }
 if(current.count<maxAttempts)return {limited:false,retrySeconds:0};
 return {limited:true,retrySeconds:Math.max(1,Math.ceil((current.until-now)/1000))};
}

export function recordLoginFailure(email:string,now=Date.now()):void{
 const key=keyFor(email);
 const current=attempts.get(key);
 if(!current||current.until<=now){
  attempts.set(key,{count:1,until:now+windowMs});
 }else{
  current.count+=1;
 }
 if(attempts.size>500){
  for(const [attemptKey,value] of attempts){
   if(value.until<=now)attempts.delete(attemptKey);
  }
 }
}

export function clearLoginFailures(email:string):void{
 attempts.delete(keyFor(email));
}
