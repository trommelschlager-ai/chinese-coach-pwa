const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('sw.js','utf8'),events={},stores=new Map(),origin='https://test.local',base=origin+'/chinese-coach-pwa/';let online=true,fail='';
const normalize=x=>new URL(typeof x==='string'?x:(x.url||x.href),base).href;
const network=async req=>{if(!online)throw Error('Offline');const url=new URL(normalize(req));let path=decodeURIComponent(url.pathname.replace('/chinese-coach-pwa/',''))||'index.html';if(path===fail)throw Error('File unavailable');return new Response(fs.readFileSync(path))};
const cacheAPI={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {addAll:async paths=>{await Promise.all(paths.map(async path=>store.set(normalize(path),await network(path))))},keys:async()=>[...store.keys()].map(url=>({url})),put:async (r,v)=>store.set(normalize(r),v),match:async r=>store.get(normalize(r))?.clone(),delete:async r=>store.delete(normalize(r))}},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),match:async r=>{for(const s of stores.values()){const v=s.get(normalize(r));if(v)return v.clone()}}};
class ScopedRequest extends Request{constructor(path,options){super(new URL(path,base),options)}};
const ctx={URL,Promise,Request:ScopedRequest,Response,fetch:network,caches:cacheAPI,AbortController,setTimeout,clearTimeout,self:{location:{origin},registration:{scope:base},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>events[n]=f}};
vm.runInNewContext(code,ctx);
(async()=>{let pending;events.install({waitUntil:p=>pending=p});await pending;const currentCache=(code.match(/const CACHE='([^']+)'/)||[])[1];assert(currentCache?.startsWith('chinese-coach-pwa-v'));assert.deepEqual(await cacheAPI.keys(),[currentCache]);const coreCount=stores.get(currentCache).size;assert(coreCount<=170,'Only the approved app shell and both introductory HSK2 pages should be required at install');const coreBytes=[...stores.get(currentCache).keys()].reduce((n,url)=>{const p=decodeURIComponent(new URL(url).pathname.replace('/chinese-coach-pwa/',''))||'index.html';return n+fs.statSync(p).size},0);assert(coreBytes<5000000,'Keep shell including the exact approved home art under 5 MB');assert(!await cacheAPI.match('./assets/approved-welcome.png'),'Unused large cover must not be preloaded');
const retained='./assets/course-human/cmn-我.mp3',oldImage='./assets/hanzi-paper-v141.png',oldData='./assets/hanzi-data/大.json';
const oldCache=await cacheAPI.open('chinese-coach-pwa-v48');for(const path of [retained,oldImage,oldData])await oldCache.put(path,await network(path));
const stalePanda='./assets/panda-live-screen-v270.mjs?v=302',stalePandaPage='./panda-voice-pilot.html?v=302';
await oldCache.put(stalePanda,await network(stalePanda));await oldCache.put(stalePandaPage,await network(stalePandaPage));
await oldCache.put('./assets/obsolete.js?v=1',new Response('obsolete'));await oldCache.put('./index.html',new Response('obsolete shell'));
events.activate({waitUntil:p=>pending=p});await pending;assert(stores.has('chinese-coach-pwa-v48'),'Old media cache is preserved instead of being copied during activation');
for(const p of [retained,oldImage,oldData,'./assets/panda-go-hero-clean-v174.webp','./assets/hanzi-approved-v141.png'])assert((await cacheAPI.match(p))?.ok,'Required media retained: '+p);
assert((await cacheAPI.match('./assets/obsolete.js?v=1')),'Legacy cache is preserved without migrating its scripts to the new shell');
assert(!stores.get(currentCache).has(normalize('./assets/obsolete.js?v=1')),'Stale old JS must not be copied into the new version cache');

const request=async(url,mode)=>{let p;events.fetch({request:{url:normalize(url),method:'GET',mode},respondWith:r=>p=r});return await p};
await oldCache.put('./assets/lesson-audio-source.js?v=246',new Response('obsolete cached audio UI'));
const freshScript=await (await request('./assets/lesson-audio-source.js?v=246','cors')).text();assert.equal(freshScript,fs.readFileSync('assets/lesson-audio-source.js','utf8'),'Versioned online script must bypass cached obsolete content');
// Legacy Panda is not deleted until every current chat asset was safely cached.
events.message({data:{type:'PRUNE_PANDA_LEGACY'},waitUntil:p=>pending=p});await pending;
assert(await oldCache.match(stalePanda),'Must not erase old offline Panda before new code is cached');
for(const p of ['./panda-voice-pilot.html','./assets/panda-live-screen-v270.mjs?v=319',
 './assets/panda-live-dialogue-v272.mjs?v=319','./assets/panda-hsk1-questions-v281.mjs?v=319']){
 const response=await request(p,p.endsWith('.html')?'navigate':'cors');
 assert(response.ok,'Current Panda asset is fetchable: '+p);
}
events.message({data:{type:'PRUNE_PANDA_LEGACY'},waitUntil:p=>pending=p});await pending;
assert(!await oldCache.match(stalePanda),'Stale Panda script must be pruned after safe activation');
assert(!await oldCache.match(stalePandaPage),'Stale Panda HTML must be pruned after safe activation');
assert((await oldCache.match(retained))?.ok,'Approved human recording must remain cached');
assert(await oldCache.match('./assets/obsolete.js?v=1'),'Other archive caches are not touched');
online=false;assert((await (await request('./','navigate')).text()).includes('const COURSE'));assert((await (await request('./hanzi-lab.html','navigate')).text()).includes('Пишем иероглифы'));assert((await (await request('./hsk1-map.html','navigate')).text()).includes('Карта уроков HSK 1'),'HSK 1 map must remain available offline');assert((await (await request('./hsk1-lesson.html','navigate')).text()).includes('id="lesson-steps"'),'New HSK lessons must be available offline');assert((await (await request('./','navigate')).text()).includes('const COURSE'),'Hanzi navigation must not overwrite cached home');assert.equal((await request('./not-saved.html','navigate')).status,503,'Missing offline route gets a useful response');
online=true;const download=async()=>{let result;events.message({data:{type:'DOWNLOAD_COURSE'},ports:[{postMessage:m=>{if(m.done)result=m},close(){}}],waitUntil:p=>pending=p});await pending;return result};
fail='assets/hanzi-data/木.json';let report=await download();assert.equal(report.failed,1,'One broken optional file does not abort all downloads');assert(report.saved>100);fail='';report=await download();assert.equal(report.failed,0,'Retry completes the missing file');assert(report.total>100);
online=false;for(const p of JSON.parse(fs.readFileSync('assets/offline-pack.json')).files){assert((await request(p,'cors')).ok,'Downloaded material must be available offline: '+p)}assert((await cacheAPI.match('./offline-ready.json')).ok);
assert((await (await request('./assets/vendor/hanzi-writer.min.js','cors')).text()).includes('HanziWriter'));assert((await (await request('./assets/hanzi-data/大.json','cors')).json()).strokes.length===3);
console.log(`Offline checks passed: ${coreCount} core URLs; ${report.saved} optional files, failed-download recovery, local writing, home isolation.`);
})().catch(e=>{console.error(e);process.exitCode=1});
