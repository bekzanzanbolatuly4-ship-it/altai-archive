/** Resolve and validate the public origin used by sitemap and canonical metadata. */
export function getPublicSiteUrl(): URL {
  const configured=process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const trustedOrigin=process.env.APP_ORIGIN?.trim();
  const production=process.env.NODE_ENV==='production';
  if(production&&(!configured||!trustedOrigin)){
    throw new Error('APP_ORIGIN and NEXT_PUBLIC_SITE_URL must both be configured in production');
  }
  const value=configured||trustedOrigin||'http://localhost:3000';
  let url:URL;
  try{url=new URL(value);}catch{throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute site origin');}
  if(url.pathname!=='/'||url.search||url.hash||url.username||url.password){
    throw new Error('NEXT_PUBLIC_SITE_URL must contain only an origin');
  }
  if(production&&url.protocol!=='https:'){
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
  }
  if(production){
    let trusted:URL;
    try{trusted=new URL(trustedOrigin!);}catch{throw new Error('APP_ORIGIN must be a valid HTTPS origin in production');}
    if(trusted.pathname!=='/'||trusted.search||trusted.hash||trusted.username||trusted.password||trusted.protocol!=='https:'){
      throw new Error('APP_ORIGIN must be an HTTPS origin in production');
    }
    if(trusted.origin!==url.origin){
      throw new Error('APP_ORIGIN and NEXT_PUBLIC_SITE_URL must match in production');
    }
  }
  return new URL(url.origin);
}
