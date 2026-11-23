import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { quotaPolicy } from './worker.mjs';

const dayMs = 86_400_000;
const now = Date.now();
const userId = '123e4567-e89b-12d3-a456-426614174000';
const origin = 'https://trommelschlager-ai.github.io';
const daysAgo = n => new Date(now-n*dayMs).toISOString();

class FakeD1 {
  entitlements = new Map();
  usage = new Map();
  prepare(sql) {
    return { bind: (...args) => ({
      first: async () => {
        if (sql.startsWith('SELECT purchased_at')) return this.entitlements.get(args[0]) || null;
        if (sql.startsWith('SELECT used')) return this.usage.has(args[0]+':'+args[1]) ? {used:this.usage.get(args[0]+':'+args[1])}:null;
        if (sql.startsWith('INSERT INTO ai_daily_usage')) {
          const k=args[0]+':'+args[1],old=this.usage.get(k)||0;
          if (old>=args[2]) return null;
          this.usage.set(k,old+1);return {used:old+1};
        }
        throw Error('Unexpected query: '+sql);
      },
      run: async () => {
        if (sql.startsWith('UPDATE ai_daily_usage')) {
          const k=args[0]+':'+args[1];this.usage.set(k,Math.max(0,(this.usage.get(k)||0)-1));return {};
        }
        if (sql.startsWith('DELETE FROM ai_daily_usage')) {
          for(const k of this.usage.keys()) if(k.startsWith(args[0]+':')) this.usage.delete(k);return {};
        }
        if (sql.startsWith('INSERT INTO course_entitlements')) {
          this.entitlements.set(args[0],{purchased_at:args[1],source:'test'});return {};
        }
        throw Error('Unexpected query: '+sql);
      }
    })};
  }
}
function setup(purchasedAt=daysAgo(1),key='demo') {
  const db=new FakeD1();
  if(purchasedAt) db.entitlements.set(userId,{purchased_at:purchasedAt,source:'test'});
  const env={DB:db,SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ALLOWED_ORIGIN:origin,GEMINI_API_KEY:key,ENABLE_TEST_GRANTS:'false',ADMIN_SECRET:'owner-private-secret'};
  globalThis.fetch=async(url)=>String(url).includes('supabase.co')?Response.json({id:userId}):Response.json({candidates:[{content:{parts:[{text:'你好！'}]}}]});
  return {env,db};
}
function request(path,options={},token='user-token',fromOrigin=origin){
  return new Request('https://worker.test'+path,{...options,headers:{...(token?{authorization:'Bearer '+token}:{}),...(fromOrigin?{origin:fromOrigin}:{}),...(options.headers||{})}});
}
async function call(env,req){
  const res=await worker.fetch(req,env);
  return {status:res.status,body:res.status===204?null:await res.json()};
}
afterEach(()=>{delete globalThis.fetch});
test('10 answers for 30 full days, then 3',()=>{
  const start='2026-01-01T09:00:00Z',t=Date.parse(start);
  assert.equal(quotaPolicy(start,t).limit,10);
  assert.equal(quotaPolicy(start,t+30*dayMs-1).limit,10);
  assert.equal(quotaPolicy(start,t+30*dayMs).limit,3);
});
test('reject invalid/future purchase time',()=>{
  assert.throws(()=>quotaPolicy('invalid',now));
  assert.throws(()=>quotaPolicy(daysAgo(-1),now));
});
test('authenticated quota includes daily reset, no course yields 403',async()=>{
  let {env}=setup();
  const good=await call(env,request('/api/quota'));
  assert.equal(good.status,200);assert.equal(good.body.remaining,10);
  assert.match(good.body.resetsAt,/T00:00:00/);
  assert.equal((await call(env,request('/api/quota',{},''))).status,401);
  ({env}=setup(null));
  assert.equal((await call(env,request('/api/quota'))).body.code,'NO_COURSE');
});
test('browser origin enforced, preflight has no body',async()=>{
  const {env}=setup();
  assert.equal((await call(env,request('/api/quota',{},'token','https://evil.test'))).status,403);
  const res=await worker.fetch(request('/api/chat',{method:'OPTIONS'}),env);
  assert.equal(res.status,204);assert.equal(await res.text(),'');
});
test('parallel requests never exceed limit 10',async()=>{
  const {env}=setup();
  const tasks=Array.from({length:12},(_,i)=>call(env,request('/api/chat',{method:'POST',body:JSON.stringify({message:'你好'+i})})));
  const responses=await Promise.all(tasks);
  assert.equal(responses.filter(r=>r.status===200).length,10);
  assert.equal(responses.filter(r=>r.status===429).length,2);
  assert.equal((await call(env,request('/api/quota'))).body.remaining,0);
});
test('after day 30, only 3 replies are possible',async()=>{
  const {env}=setup(daysAgo(35));
  const tasks=Array.from({length:4},()=>call(env,request('/api/chat',{method:'POST',body:JSON.stringify({message:'你好吗'})})));
  const res=await Promise.all(tasks);
  assert.equal(res.filter(r=>r.status===200).length,3);
  assert.equal(res.filter(r=>r.status===429).length,1);
});
test('missing AI key and provider failures do not consume quota',async()=>{
  let {env}=setup(daysAgo(1),'');
  assert.equal((await call(env,request('/api/chat',{method:'POST',body:JSON.stringify({message:'你好'})}))).body.code,'AI_NOT_CONFIGURED');
  assert.equal((await call(env,request('/api/quota'))).body.used,0);
  ({env}=setup());
  globalThis.fetch=async url=>String(url).includes('supabase.co')?Response.json({id:userId}):new Response('rate limited',{status:429});
  assert.equal((await call(env,request('/api/chat',{method:'POST',body:JSON.stringify({message:'你好'})}))).body.code,'AI_ERROR');
  assert.equal((await call(env,request('/api/quota'))).body.used,0);
});
test('admin grant never works without explicit test config and secret',async()=>{
  const {env}=setup(null),body=JSON.stringify({userId});
  const opts={method:'POST',body,headers:{'x-admin-secret':'owner-private-secret'}};
  assert.equal((await call(env,request('/admin/test-grant',opts))).status,403);
  env.ENABLE_TEST_GRANTS='true';
  assert.equal((await call(env,request('/admin/test-grant',{method:'POST',body}))).status,403);
  assert.equal((await call(env,request('/admin/test-grant',opts))).status,200);
  assert.equal((await call(env,request('/api/quota'))).body.limit,10);
});
