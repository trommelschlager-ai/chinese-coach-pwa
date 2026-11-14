const CACHE='chinese-coach-pwa-v326-approved-panda-ai-20261114';
// Only the application shell is required for an update. Pictures and audio are resumable downloads.
// v262: refresh the active worker after updated lesson-two audio assets.
const CORE=["./assets/panda-reference-v175.css?v=175","./assets/panda-reference-v175/bridge.webp","./assets/panda-reference-v175/mountain-stairs.webp","./assets/guided-voice-v1506.js?v=1","./assets/guided-introduction.js?v=151","./start-chinese.html","./hsk1-map.html","./assets/hsk1-map-final-v319.css?v=319","./assets/panda-map-logo-approved-v319.svg","./assets/panda-map-scene-hd-v319.webp","./assets/panda-map-traveller-hd-v319.webp","./assets/hsk1-map-v252.css?v=258","./assets/panda-reference-cutout-v312.svg","./assets/panda-map-roof-v310.svg","./assets/panda-map-pagoda-v310.svg","./assets/panda-map-bridge-v310.svg","./assets/panda-ai-photo-v310.svg?v=310","./hsk1-rhythm.html","./assets/panda-ai-mini-v307.svg?v=307","./hsk1-lesson.html","./assets/hsk1-foundations-v152.css?v=171","./assets/hsk1-journey-approved-v176.css?v=176","./assets/hsk1-foundations-v152.js?v=230","./assets/hsk1-voices-map-v160.js?v=160","./assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3","./assets/hsk1-foundations-data-v152.js?v=188","./assets/hsk1-intro-v188.css?v=188","./assets/hsk1-intro-v188.js?v=188","./assets/assemble-alive-v149.js?v=1","./assets/assemble-alive-v149.css?v=1","./assets/dialogue-player-v144.js?v=148","./assets/word-examples-v144.js?v=145","./assets/hanzi-paper-v141.png","./assets/panda-go-hero-clean-v174.webp","./assets/hanzi-approved-v141.png","./assets/approved-divider-v112.webp","./assets/approved-quiz-scene-v112.webp","./index.html","./hanzi-lab.html","./game.html","./travel.html","./assets/travel-entry-v1.css?v=1","./assets/travel-wow-v1.css?v=2","./assets/travel-voice-v1.js?v=3","./assets/travel-voice-v1.css?v=2","./assets/dialogue-voices-map.js?v=73","./assets/dialogue-voices-v73/status.json","./manifest.webmanifest","./assets/final-design.css?v=41","./assets/six-lessons-menu.css?v=2","./assets/menu-v3-approved.css?v=1","./assets/menu-v3-approved.js?v=3","./assets/panda-approved-lesson-ui-v129.css?v=1","./assets/panda-approved-lesson-ui-v129.js?v=1","./assets/panda-approved-hanzi-ui-v129.css?v=1","./assets/menu-v3-approved.webp","./assets/learning-quality.css?v=53","./assets/semantic-art.js?v=29","./assets/voice-settings.js?v=61","./assets/listening-lab.js?v=61","./assets/pronunciation-hub.js?v=98","./assets/human-audio-map.js?v=106","./assets/study-audio-map.js?v=59","./assets/basic-word-audio-map.js?v=66","./assets/learning-quality.js?v=145","./assets/simple-learning.css?v=118","./assets/approved-lesson-design.css?v=56","./assets/mobile-compact-v60.css?v=61","./assets/pinyin-combinations.css?v=65","./assets/approved-lesson-design.js?v=112","./assets/clean-learning-sections.js?v=119","./assets/hsk1-roadmap-v103.js?v=103","./assets/clean-learning-sections.css?v=119","./assets/approved-screens-v109.css?v=112","./assets/hsk1-roadmap-v103.css?v=103","./assets/ui-polish-v69.css?v=69","./assets/ui-polish-v70.css?v=70","./assets/ui-polish-v71.css?v=71","./assets/dialogue-sakura-v71.svg","./assets/dialogue-pagoda-v71.svg","./assets/dialogue-clock-v71.svg","./assets/game-practice-v102.js?v=119","./assets/game-sakura-petals-v126.js?v=1","./assets/game-original-listening-v86.css?v=87","./assets/game-practice-v76.css?v=77","./assets/game-practice-entry-v76.css?v=76","./assets/game-panda-v80.webp","./assets/approved-v95.css?v=97","./assets/chinese-pastel-wallpaper.svg","./assets/game-polish-v77.css?v=77","./assets/game-immersive-v78.css?v=79","./assets/game-standalone-v80.css?v=88","./assets/game-crisp-build-choose-v89.css?v=94","./assets/game-approved-layout-v85.css?v=87","./assets/game-landscape-v77.svg","./assets/offline-pack.json","./assets/vendor/hanzi-writer.min.js","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./assets/audit-fixes-v98.css?v=98.2","./assets/restore-design-v99.css?v=99.2","./assets/game-static-background-v102.css?v=108","./assets/progress-store-v98.js?v=98","./assets/daily-study-v98.js?v=117","./assets/approved-mobile-v112.css?v=119","./assets/approved-woman-v112.webp","./assets/approved-man-v112.webp","./assets/approved-topic-1-v112.webp","./assets/approved-topic-0-v112.webp","./assets/approved-topic-2-v112.webp","./assets/approved-pastel-v112.webp","./assets/approved-topic-3-v112.webp","./assets/vendor/icons/arrow-left.svg","./assets/vendor/icons/volume-2.svg","./assets/vendor/icons/message-circle-more.svg","./assets/panda-v130.css?v=151","./assets/hsk-approved-three-screens-v151.css?v=151","./assets/panda-word-sentences-v148.js?v=148","./assets/panda-v130.js?v=319","./assets/panda-hsk-scenic-v315.css?v=315","./assets/panda-hsk-two-levels-v314.css?v=314","./hsk1-hsk2-bridge.html","./assets/hsk2-speaking-v324.js?v=324","./assets/hsk2-speaking-v324.css?v=324","./assets/hsk1-hsk2-bridge-compact-v323.css?v=323","./assets/hsk2-one-screen-v323.css?v=323","./hsk1-second-v203.html","./assets/hsk1-second-v203.js?v=322","./hsk2-start.html", "./assets/hsk2-compact-refinement-v328.css?v=328", "./assets/hsk2-panda-new-v328.svg","./assets/hsk2-speaking-v326.js?v=326","./assets/hsk2-five-attempts-banner-v326.css?v=326","./assets/panda-guide-v215.svg","./assets/chinese-waterfall-banner.svg","./hsk2-introduction.html","./assets/panda-brain-v341.js?v=341","./assets/hsk2-user-voice/phrase-index-v332.js?v=332","./assets/hsk2-user-voice/20261114-words-a-v338.mp3","./assets/hsk2-user-voice/20261114-words-b-v338.mp3","./assets/hsk2-user-voice/20261114-phrases-v338.mp3","./assets/hsk2-audio-coverage-v332.json","./assets/hsk2-user-voice/20261114-47SW44.mp3","./assets/hsk2-user-voice/20261114-7JVWfV.mp3","./assets/hsk2-user-voice/20261114-APqUx9.mp3","./assets/hsk2-user-voice/20261114-BWLSNa.mp3","./assets/hsk2-user-voice/20261114-FMAH9S.mp3","./assets/hsk2-user-voice/20261114-K0Uh5q.mp3","./assets/hsk2-user-voice/20261114-M7EwcW.mp3","./assets/hsk2-user-voice/20261114-W6Okix.mp3","./assets/hsk2-user-voice/20261114-bsPFJr.mp3","./assets/hsk2-user-voice/20261114-d9kQmz.mp3", "./assets/owner-audio-v237.js", "./assets/hsk2-audio-v330.js?v=339","./assets/hsk2-user-voice/B01-B10-20261113.mp3", "./assets/hsk2-audio-v330.css?v=339", "./assets/hsk2-audio-coverage-v330.json", "./assets/hsk2-speaking-v326.js?v=332", "./assets/hsk2-fixes-v329.css?v=329","./assets/panda-hanzi-v130.css?v=138","./assets/hanzi-exact-v141.css?v=145","./assets/hanzi-exact-v141.js?v=145","./assets/hanzi-phrases-v141.js?v=141","./assets/panda-hanzi-v130.js?v=135","./assets/panda-v130/check.webp","./assets/panda-v130/flowers.webp","./assets/panda-v130/landscape.webp","./assets/hsk1-archive-style-v178.css?v=179","./assets/panda-v130/puzzle.webp","./assets/panda-v130/training-panda.webp","./assets/hsk1-separate-steps-v178.js?v=179","./assets/hsk1-compact-v180.css?v=180","./assets/hsk1-compact-v180.js?v=181","./assets/hsk1-coach-v181.css?v=181","./assets/hsk1-clarity-v182.css?v=182","./hsk1-first-v189.html","./assets/hsk1-first-v189.css?v=300","./assets/hsk1-first-v189.js?v=300","./assets/hsk1-native-clean-v198.js?v=198","./assets/native-owner-v200.js?v=200","./assets/native-owner-v200/wo.ogg","./assets/native-owner-v200/shi.ogg","./assets/native-owner-v200/tianqi.ogg","./assets/lesson-viewport.js?v=237","./assets/owner-audio-v237.js?v=237","./assets/fallback-audio-v237.js?v=237","./assets/lesson-audio-source.js?v=282","./assets/hsk1-map-photo2-v315.css?v=315","./assets/hsk1-photo2-scene-v315.webp","./panda-voice-pilot.html","./assets/panda-live-audio.mjs?v=336","./assets/hsk2-user-voice/phrase-index-v332.js?v=336","./assets/panda-voice-pilot.css?v=326","./assets/panda-live-screen-v270.mjs?v=336","./assets/panda-ask-catalog-v326.mjs?v=336","./assets/panda-basic-conversation-v323.mjs?v=336","./assets/panda-live-dialogue-v272.mjs?v=336","./assets/panda-home-photo1-v319.css?v=319","./assets/panda-home-approved-photo1-v319.jpg"];;;;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Claim new pages immediately. Keep older audio caches intact; copying
 // thousands of media files during activation can prevent SW updates.
 await self.clients.claim();
})()));
async function activeCacheMatch(key){const current=await caches.open(CACHE);return await current.match(key)||await caches.match(key)}
async function network(request,timeout=12000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
 // Local preview must reflect edits before a production version is published.
 if(['localhost','127.0.0.1','terminal.local'].includes(url.hostname))return;
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))return;
 const isHome=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
 const key=req.mode==='navigate'&&isHome?'./index.html':req;
 async function fetchAndSave(){const response=await network(req,req.mode==='navigate'?3500:12000);if(response.ok){const cache=await caches.open(CACHE);await cache.put(key,response.clone())}return response}
 if(req.mode==='navigate'){
  event.respondWith(fetchAndSave().catch(async()=>await activeCacheMatch(key)||new Response('Материал ещё не сохранён. Подключи интернет и скачай его в настройках.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
 }else if(/\.(?:mjs|js|css)$/.test(url.pathname)){
  // Never deliver a stale JS/CSS asset for a newer ?v= URL.
  event.respondWith((async()=>{
   // Network-first even when a versioned script was cached previously.
   // A failed Pages deployment or partial cache must not freeze old code.
   const cached=await activeCacheMatch(req);
   try{return await fetchAndSave()}catch{return cached||new Response('',{status:503})}
  })());
 }else event.respondWith(activeCacheMatch(req).then(hit=>hit||fetchAndSave()).catch(()=>new Response('',{status:503})));
});
// Remove only superseded Panda chat scripts/pages after all CURRENT chat assets
// are safely saved in the new cache. Preserve human MP3, HSK1 data and progress.
const PANDA_CURRENT=['./assets/panda-live-approved-v337.webp','./assets/panda-live-approved-v337.css?v=337','./assets/panda-live-approved-v337.mjs?v=337','./panda-voice-pilot.html','./assets/panda-live-audio.mjs?v=336','./assets/hsk2-user-voice/phrase-index-v332.js?v=336','./assets/panda-live-screen-v270.mjs?v=336',
 './assets/panda-ask-catalog-v326.mjs?v=336',
 './assets/panda-basic-conversation-v323.mjs?v=336',
 './assets/panda-voice-pilot.css?v=326','./assets/panda-live-dialogue-v272.mjs?v=336','./assets/panda-hsk1-questions-v281.mjs?v=319'];
const PANDA_LEGACY_PATHS=new Set(PANDA_CURRENT.map(path=>new URL(path,self.registration.scope).pathname));
async function pruneLegacyPandaAssets(){
 const current=await caches.open(CACHE);
 for(const path of PANDA_CURRENT)if(!await current.match(path))return false;
 const scope=new URL(self.registration.scope),names=await caches.keys();
 for(const name of names){
  if(name===CACHE||!name.startsWith('chinese-coach-pwa-v'))continue;
  const old=await caches.open(name);
  for(const request of await old.keys()){
   const url=new URL(request.url);
   if(url.origin===scope.origin&&PANDA_LEGACY_PATHS.has(url.pathname))await old.delete(request);
  }
 }
 return true;
}
self.addEventListener('message',event=>{
 if(event.data?.type==='PRUNE_PANDA_LEGACY'){
  event.waitUntil(pruneLegacyPandaAssets().catch(()=>{}));
  return;
 }
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
   if(!failed){
    await cache.put('./offline-ready.json',new Response(JSON.stringify({saved,total:files.length,completedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}}));
    // Old cache entries are deleted only once latest Panda files exist in CACHE.
    await pruneLegacyPandaAssets().catch(()=>{});
   }
  }catch{failed++}
  port.postMessage({saved,failed,total:files.length,done:true});port.close();
 })());
});
