export class AIError extends Error {
 code:string;
 status:number;
 constructor(code:string,status=503){super(code);this.code=code;this.status=status;}
}
