const CACHE='chinese-coach-pwa-v75';
// Only the application shell is required for an update. Pictures and audio are resumable downloads.
const CORE=['./','./index.html','./hanzi-lab.html','./manifest.webmanifest','./assets/approved-home-v36.png','./assets/lessons-backdrop.webp','./assets/final-design.css?v=41','./assets/six-lessons-menu.css?v=2','./assets/learning-quality.css?v=53','./assets/semantic-art.js?v=29','./assets/voice-settings.js?v=61','./assets/listening-lab.js?v=61','./assets/pronunciation-hub.js?v=75','./assets/human-audio-map.js?v=49','./assets/study-audio-map.js?v=59','./assets/basic-word-audio-map.js?v=66','./assets/learning-quality.js?v=73','./assets/simple-learning.css?v=55','./assets/approved-lesson-design.css?v=56','./assets/mobile-compact-v60.css?v=61','./assets/pinyin-combinations.css?v=65','./assets/approved-lesson-design.js?v=57','./assets/clean-learning-sections.js?v=73','./assets/clean-learning-sections.css?v=66','./assets/ui-polish-v69.css?v=69','./assets/ui-polish-v70.css?v=70','./assets/ui-polish-v71.css?v=71','./assets/dialogue-sakura-v71.svg','./assets/dialogue-pagoda-v71.svg','./assets/dialogue-clock-v71.svg','./assets/dialogue-cafe-v71.svg','./assets/china-autumn-temple-v71.webp','./assets/china-misty-pavilion-v70.webp','./assets/offline-pack.json','./assets/vendor/hanzi-writer.min.js','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chinese-coach-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
async function network(request,timeout=12000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))return;
 const isHome=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
 const key=req.mode==='navigate'&&isHome?'./index.html':req;
 async function fetchAndSave(){const response=await network(req,req.mode==='navigate'?3500:12000);if(response.ok){const cache=await caches.open(CACHE);await cache.put(key,response.clone())}return response}
 if(req.mode==='navigate'){
  event.respondWith(fetchAndSave().catch(async()=>await caches.match(key)||new Response('Материал ещё не сохранён. Подключи интернет и скачай его в настройках.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
 }else event.respondWith(caches.match(req).then(hit=>hit||fetchAndSave()).catch(()=>new Response('',{status:503})));
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='DOWNLOAD_COURSE'||!event.ports[0])return;
 const port=event.ports[0];
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);let saved=0,failed=0,files=[];
  try{const response=await network(new URL('./assets/offline-pack.json',self.registration.scope));if(!response.ok)throw Error('manifest');files=(await response.json()).files;
   if(!Array.isArray(files))throw Error('manifest');
   let cursor=0;const work=async()=>{while(cursor<files.length){const path=files[cursor++],url=new URL(path,self.registration.scope);
    if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname)){failed++;continue}
    try{if(!await cache.match(url.href)){const response=await network(url.href);if(!response.ok)throw Error('file');await cache.put(url.href,response)}saved++}catch{failed++}
    port.postMessage({saved,failed,total:files.length,done:false});
   }};
   await Promise.all(Array.from({length:4},work));
   if(!failed)await cache.put('./offline-ready.json',new Response(JSON.stringify({saved,total:files.length,completedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}}));
  }catch{failed++}
  port.postMessage({saved,failed,total:files.length,done:true});port.close();
 })());
});
