export type RegistrationInput={name:string;email:string;password:string;confirmPassword:string;consent:boolean};
export type RegistrationError='invalid_name'|'invalid_email'|'weak_password'|'password_mismatch'|'consent_required';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const controlChars=/[\u0000-\u001f\u007f]/u;

export function validateRegistrationInput(input:RegistrationInput):RegistrationError|null{
 const name=input.name.trim();const email=input.email.trim();
 if(!name||name.length>80||controlChars.test(name))return 'invalid_name';
 if(!email||email.length>254||!emailPattern.test(email))return 'invalid_email';
 if(input.password.length<12||input.password.length>1024)return 'weak_password';
 if(input.password!==input.confirmPassword)return 'password_mismatch';
 if(input.consent!==true)return 'consent_required';
 return null;
}
