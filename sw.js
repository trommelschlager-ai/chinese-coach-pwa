const CACHE='chinese-coach-pwa-v129-20261104-approved-33150-33151';
// Only the application shell is required for an update. Pictures and audio are resumable downloads.
const CORE=["./assets/approved-divider-v112.webp","./assets/approved-quiz-scene-v112.webp","./index.html","./hanzi-lab.html","./game.html","./travel.html","./assets/travel-entry-v1.css?v=1","./assets/travel-wow-v1.css?v=2","./assets/travel-voice-v1.js?v=3","./assets/travel-voice-v1.css?v=2","./assets/dialogue-voices-map.js?v=73","./manifest.webmanifest","./assets/approved-home-v36.png","./assets/lessons-backdrop.webp","./assets/final-design.css?v=41","./assets/six-lessons-menu.css?v=2","./assets/menu-v3-approved.css?v=1","./assets/menu-v3-approved.js?v=3","./assets/panda-approved-lesson-ui-v129.css?v=1","./assets/panda-approved-lesson-ui-v129.js?v=1","./assets/panda-approved-hanzi-ui-v129.css?v=1","./assets/menu-v3-approved.webp","./assets/learning-quality.css?v=53","./assets/semantic-art.js?v=29","./assets/voice-settings.js?v=61","./assets/listening-lab.js?v=61","./assets/pronunciation-hub.js?v=98","./assets/human-audio-map.js?v=106","./assets/study-audio-map.js?v=59","./assets/basic-word-audio-map.js?v=66","./assets/learning-quality.js?v=113","./assets/simple-learning.css?v=118","./assets/approved-lesson-design.css?v=56","./assets/mobile-compact-v60.css?v=61","./assets/pinyin-combinations.css?v=65","./assets/approved-lesson-design.js?v=112","./assets/clean-learning-sections.js?v=119","./assets/hsk1-roadmap-v103.js?v=103","./assets/clean-learning-sections.css?v=119","./assets/approved-screens-v109.css?v=112","./assets/hsk1-roadmap-v103.css?v=103","./assets/ui-polish-v69.css?v=69","./assets/ui-polish-v70.css?v=70","./assets/ui-polish-v71.css?v=71","./assets/dialogue-sakura-v71.svg","./assets/dialogue-pagoda-v71.svg","./assets/dialogue-clock-v71.svg","./assets/game-practice-v102.js?v=119","./assets/game-sakura-petals-v126.js?v=1","./assets/game-original-listening-v86.css?v=87","./assets/game-practice-v76.css?v=77","./assets/game-practice-entry-v76.css?v=76","./assets/game-panda-v80.webp","./assets/game-scene-choose-v94.webp","./assets/approved-v95.css?v=97","./assets/chinese-pastel-wallpaper.svg","./assets/game-polish-v77.css?v=77","./assets/game-immersive-v78.css?v=79","./assets/game-standalone-v80.css?v=88","./assets/game-crisp-build-choose-v89.css?v=94","./assets/game-approved-layout-v85.css?v=87","./assets/game-landscape-v77.svg","./assets/offline-pack.json","./assets/vendor/hanzi-writer.min.js","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./assets/audit-fixes-v98.css?v=98.2","./assets/restore-design-v99.css?v=99.2","./assets/game-static-background-v102.css?v=108","./assets/progress-store-v98.js?v=98","./assets/daily-study-v98.js?v=117","./assets/approved-mobile-v112.css?v=119","./assets/approved-woman-v112.webp","./assets/approved-man-v112.webp","./assets/approved-topic-1-v112.webp","./assets/approved-topic-0-v112.webp","./assets/approved-panda-lake-v112.webp","./assets/approved-topic-2-v112.webp","./assets/approved-pastel-v112.webp","./assets/approved-topic-3-v112.webp","./assets/approved-cloud-v112.webp","./assets/vendor/icons/arrow-left.svg","./assets/vendor/icons/volume-2.svg","./assets/vendor/icons/message-circle-more.svg"];
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
 }else if(/\.(?:js|css)$/.test(url.pathname)){
  // Never deliver a stale JS/CSS asset for a newer ?v= URL.
  event.respondWith(fetchAndSave().catch(async()=>await caches.match(req)||new Response('',{status:503})));
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
