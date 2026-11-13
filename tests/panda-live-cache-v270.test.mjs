import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('service worker refreshes mjs modules and preserves exact offline versions',async()=>{
 const listeners={},writes=[],cached=new Response('cached v270');let offline=false,requests=0;
 const context={Request,Response,URL,AbortController,setTimeout,clearTimeout,
  self:{location:{origin:'https://panda.test'},registration:{scope:'https://panda.test/'},addEventListener:(name,fn)=>listeners[name]=fn},
  caches:{open:async name=>({match:async req=>req.url.endsWith('?v=270')?cached.clone():null,put:async(req,response)=>writes.push([name,req.url,await response.text()])}),match:async()=>null},
  fetch:async()=>{requests++;if(offline)throw Error('offline');return new Response('fresh v270')}
 };
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
 async function request(version){let answer;listeners.fetch({request:new Request('https://panda.test/assets/panda-live-screen-v270.mjs?v='+version),respondWith:p=>answer=p});return await answer}
 assert.equal(await (await request(270)).text(),'fresh v270');assert.equal(requests,1);const packVersion=JSON.parse(fs.readFileSync(new URL('../assets/offline-pack.json',import.meta.url),'utf8')).version;assert(packVersion>=272);const cacheName=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8').match(/^const CACHE='([^']+)'/m)?.[1];assert.equal(writes[0][0],cacheName,'Cached script must use active SW cache, independently of optional offline pack revision');
 offline=true;assert.equal(await (await request(270)).text(),'cached v270');assert.equal((await request(271)).status,503,'A different version must not silently load old code');
});
