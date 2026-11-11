export class FeedbackError extends Error {
 readonly code:string;
 readonly status:number;
 constructor(code:string,status:number){super(code);this.name='FeedbackError';this.code=code;this.status=status;}
}

export function safeFeedbackError(error:unknown){
 if(error instanceof FeedbackError)return {code:error.code,status:error.status};
 return {code:'feedback_storage_unavailable',status:503};
}
