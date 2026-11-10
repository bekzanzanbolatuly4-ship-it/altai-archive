import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clearLoginFailures,isLoginRateLimited,recordLoginFailure} from '../lib/login-rate-limit.ts';

test('login throttling is tied to the account identity, not a client IP header',()=>{
 const email='Audit-Rate-Limit@example.test';
 clearLoginFailures(email);
 for(let i=0;i<8;i++)recordLoginFailure(email,1_000+i);

 assert.equal(isLoginRateLimited(email,2_000).limited,true);
 assert.equal(isLoginRateLimited('different@example.test',2_000).limited,false);
 assert.equal(isLoginRateLimited(email,901_001).limited,false);
 clearLoginFailures(email);
});
