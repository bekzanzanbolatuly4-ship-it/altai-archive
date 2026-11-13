import {FeedbackError} from './feedback-errors';

export type FeedbackType='site_feedback'|'suggestion'|'site_bug';
export type FeedbackSubmission={
 type:FeedbackType;
 name:string;
 email:string|null;
 rating:number|null;
 message:string;
 contactConsent:boolean;
};

const types=new Set<FeedbackType>(['site_feedback','suggestion','site_bug']);
const allowedKeys=new Set(['type','message','website','feedbackConsent','firstName','lastName','email','rating']);
const controlChars=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export function validateFeedbackInput(input:unknown):FeedbackSubmission{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new FeedbackError('invalid_feedback',400);
 const value=input as Record<string,unknown>;
 if(Object.keys(value).some(key=>!allowedKeys.has(key)))throw new FeedbackError('invalid_feedback',400);
 if(typeof value.website!=='undefined'&&typeof value.website!=='string')throw new FeedbackError('invalid_feedback',400);
 if(typeof value.website==='string'&&value.website.trim())throw new FeedbackError('invalid_feedback',400);
 if(typeof value.type!=='string'||!types.has(value.type as FeedbackType))throw new FeedbackError('invalid_feedback',400);
 if(typeof value.firstName!=='string'||typeof value.lastName!=='string'||controlChars.test(value.firstName)||controlChars.test(value.lastName))throw new FeedbackError('invalid_feedback',400);
 const firstName=value.firstName.trim(),lastName=value.lastName.trim(),name=`${firstName} ${lastName}`.trim();
 if(!firstName||!lastName||firstName.length>40||lastName.length>40||name.length>80)throw new FeedbackError('invalid_feedback',400);
 let email:string|null=null;
 if(typeof value.email!=='undefined'&&value.email!==null){
  if(typeof value.email!=='string'||controlChars.test(value.email))throw new FeedbackError('invalid_feedback',400);
  email=value.email.trim().toLowerCase()||null;
  if(email&&(email.length>254||!/^\S+@\S+\.\S+$/.test(email)))throw new FeedbackError('invalid_feedback',400);
 }
 if(typeof value.message!=='string'||controlChars.test(value.message))throw new FeedbackError('invalid_feedback',400);
 const message=value.message.trim();
 if(message.length<10||message.length>2000)throw new FeedbackError('invalid_feedback',400);
 let rating:number|null=null;
 if(value.type==='site_feedback'){
  if(!Number.isInteger(value.rating)||Number(value.rating)<1||Number(value.rating)>5)throw new FeedbackError('invalid_feedback',400);
  rating=Number(value.rating);
 }else if(typeof value.rating!=='undefined'&&value.rating!==null){
  if(!Number.isInteger(value.rating)||Number(value.rating)<1||Number(value.rating)>5)throw new FeedbackError('invalid_feedback',400);
  rating=Number(value.rating);
 }
 if(value.feedbackConsent!==true)throw new FeedbackError('feedback_consent_required',400);
 return {type:value.type as FeedbackType,name,email,rating,message,contactConsent:true};
}

export async function readFeedbackJson(request:Request,maxBytes=8192):Promise<unknown>{
 const declared=Number(request.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>maxBytes)throw new FeedbackError('request_too_large',413);
 if(!request.body)throw new FeedbackError('invalid_feedback',400);
 const reader=request.body.getReader();
 const decoder=new TextDecoder();
 let size=0,raw='';
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>maxBytes){await reader.cancel();throw new FeedbackError('request_too_large',413);}
   raw+=decoder.decode(value,{stream:true});
  }
  raw+=decoder.decode();
 }catch(error){
  if(error instanceof FeedbackError)throw error;
  throw new FeedbackError('invalid_feedback',400);
 }
 try{return JSON.parse(raw) as unknown;}catch{throw new FeedbackError('invalid_feedback',400);}
}
