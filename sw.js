const CACHE='chinese-coach-pwa-v523-panda-why-comedy-context';
// Only the application shell is required for an update. Pictures and audio are resumable downloads.
// v262: refresh the active worker after updated lesson-two audio assets.
const CORE=["./assets/panda-everyday-meaning-v515.mjs","./assets/panda-approved-voice-registry-v516.mjs?v=520","./assets/panda-ai-xiaoxiao-new-replies-20261122/panda01.mp3","./assets/panda-ai-xiaoxiao-new-replies-20261122/panda02.mp3","./assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3","./assets/panda-ai-xiaoxiao-new-replies-20261122/panda04.mp3","./assets/panda-ai-xiaoxiao-new-replies-20261122/panda05.mp3","./assets/qa-v411/panda-voice-v422.mjs?v=422","./assets/panda-hsk2-preview-core-v1.mjs?v=523","./assets/panda-hsk2-preview-ui-v1.mjs?v=520","./assets/panda-hsk2-preview-v506.css?v=511","./assets/panda-hsk2-preview-audio-v1.mjs?v=520","./assets/panda-hsk2-brain-v1.mjs?v=523","./assets/panda-hsk2-basic-context-v1.mjs?v=5","./assets/panda-hsk2-brain-data-v1.mjs","./assets/panda-clarification-map-v504.mjs?v=505","./assets/panda-clarification-voice-20261122/index.mjs?v=505","./assets/hsk2-lesson1-voice-v459.js?v=459","./assets/panda-hsk2-my-day-scenario-v1.mjs?v=516","./panda-ai-hsk2-preview.html","./assets/panda-mobile-v394.css?v=394","./hsk2-life-course.html","./assets/hsk2-lesson-theme-v451.css?v=451","./assets/hsk2-panda-return-chat-v419.css?v=419","./assets/hsk2-panda-chat-clean-v420.css?v=420","./assets/hsk2-exact-overlay-v415.js?v=420","./assets/panda-live-screen-v270.mjs?v=465","./assets/panda-live-v346.mjs?v=453","./assets/panda-chat-corrections-v377.css?v=454","./assets/panda-approved-soft-v500.css?v=501","./assets/panda-approved-soft-v500.js?v=502","./panda-voice-pilot.html","./hsk2-bastian-intro.html","./assets/approved-course-v390/art-fit-v391.js?v=394","./assets/hsk2-day-first-ui-v1.js?v=413","./assets/hsk2-lesson1-android-fixes-v416.css?v=416","./assets/hsk2-lesson1-three-page-v418.css?v=418","./assets/pandago-art-touch-feedback-v395.js?v=417","./assets/hsk2-exact-overlay-v415.css?v=415","./assets/hsk2-approved-v414/01-words.webp","./assets/hsk2-approved-v414/02-rule.webp","./assets/hsk2-approved-v414/03-speech.webp","./assets/hsk2-approved-v414/04-test.webp","./assets/hsk2-approved-v414/05-examples.webp","./assets/hsk2-approved-v414/06-panda-ai.webp","./assets/hsk2-six-screens-v414.js?v=418","./assets/hsk2-six-screens-v414.css?v=414","./assets/hsk2-day-inline-ai-v414.js?v=415","./assets/hsk2-day-topic-one-v391.js?v=391","./assets/hsk2-day-no-scroll-v398.css?v=413","./assets/hsk2-day-scene-v413.css?v=413","./assets/panda-reference-v175.css?v=175","./assets/guided-voice-v1506.js?v=1","./assets/guided-introduction.js?v=151","./start-chinese.html","./hsk1-map.html","./assets/hsk1-v371-background.webp","./assets/hsk1-v371-header.webp","./assets/hsk1-v371-panda.webp","./assets/hsk1-map-v252.css?v=258","./assets/hsk1-v371-actions.webp","./hsk1-rhythm.html","./hsk1-lesson.html","./assets/hsk1-foundations-v152.css?v=171","./assets/hsk1-journey-approved-v176.css?v=176","./assets/hsk1-foundations-v152.js?v=230","./assets/hsk1-voices-map-v160.js?v=160","./assets/hsk1-foundations-data-v152.js?v=188","./assets/hsk1-intro-v188.css?v=188","./assets/hsk1-intro-v188.js?v=188","./assets/assemble-alive-v149.js?v=378","./assets/assemble-alive-v149.css?v=1","./assets/dialogue-player-v144.js?v=148","./assets/word-examples-v144.js?v=145","./assets/hanzi-paper-v141.png","./assets/panda-go-hero-clean-v174.webp","./assets/hanzi-approved-v141.png","./index.html","./hanzi-lab.html","./game.html","./travel.html","./assets/travel-entry-v1.css?v=1","./assets/travel-wow-v1.css?v=2","./assets/travel-voice-v1.js?v=3","./assets/travel-voice-v1.css?v=2","./assets/dialogue-voices-map.js?v=73","./assets/dialogue-voices-v73/status.json","./manifest.webmanifest","./assets/final-design.css?v=41","./assets/six-lessons-menu.css?v=2","./assets/menu-v3-approved.css?v=1","./assets/menu-v3-approved.js?v=3","./assets/panda-approved-lesson-ui-v129.css?v=1","./assets/panda-approved-lesson-ui-v129.js?v=1","./assets/menu-v3-approved.webp","./assets/learning-quality.css?v=53","./assets/semantic-art.js?v=29","./assets/voice-settings.js?v=61","./assets/listening-lab.js?v=61","./assets/pronunciation-hub.js?v=98","./assets/human-audio-map.js?v=106","./assets/study-audio-map.js?v=59","./assets/basic-word-audio-map.js?v=66","./assets/learning-quality.js?v=145","./assets/simple-learning.css?v=118","./assets/approved-lesson-design.css?v=56","./assets/mobile-compact-v60.css?v=61","./assets/pinyin-combinations.css?v=65","./assets/approved-lesson-design.js?v=112","./assets/clean-learning-sections.js?v=119","./assets/hsk1-roadmap-v103.js?v=103","./assets/clean-learning-sections.css?v=119","./assets/approved-screens-v109.css?v=112","./assets/hsk1-roadmap-v103.css?v=103","./assets/ui-polish-v69.css?v=69","./assets/ui-polish-v70.css?v=70","./assets/ui-polish-v71.css?v=71","./assets/game-practice-v102.js?v=119","./assets/game-sakura-petals-v126.js?v=1","./assets/game-original-listening-v86.css?v=87","./assets/game-practice-v76.css?v=77","./assets/game-practice-entry-v76.css?v=76","./assets/approved-v95.css?v=97","./assets/chinese-pastel-wallpaper.svg","./assets/game-polish-v77.css?v=77","./assets/game-immersive-v78.css?v=79","./assets/game-standalone-v80.css?v=88","./assets/game-crisp-build-choose-v89.css?v=94","./assets/game-approved-layout-v85.css?v=87","./assets/offline-pack.json","./assets/vendor/hanzi-writer.min.js","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./assets/audit-fixes-v98.css?v=98.2","./assets/restore-design-v99.css?v=99.2","./assets/game-static-background-v102.css?v=108","./assets/progress-store-v98.js?v=98","./assets/daily-study-v98.js?v=117","./assets/approved-mobile-v112.css?v=119","./assets/vendor/icons/arrow-left.svg","./assets/vendor/icons/volume-2.svg","./assets/vendor/icons/message-circle-more.svg","./assets/panda-v130.css?v=151","./assets/hsk-approved-three-screens-v151.css?v=151","./assets/panda-word-sentences-v148.js?v=148","./assets/panda-v393-polish.css?v=393","./assets/bastian-split-v394.js?v=394","./assets/bastian-two-screen-v393.css?v=393","./assets/approved-course-v393-viewport.css?v=393","./assets/panda-hsk-scenic-v315.css?v=315","./assets/panda-hsk-two-levels-v314.css?v=314","./hsk1-hsk2-bridge.html","./assets/hsk2-speaking-v324.css?v=324","./assets/hsk1-hsk2-bridge-compact-v323.css?v=323","./assets/hsk2-one-screen-v323.css?v=323","./hsk1-second-v203.html","./hsk2-start.html","./assets/hsk2-compact-refinement-v328.css?v=328","./assets/hsk2-panda-new-v328.svg","./assets/hsk2-five-attempts-banner-v326.css?v=326","./assets/panda-guide-v215.svg","./assets/chinese-waterfall-banner.svg","./hsk2-introduction.html","./assets/hsk2-audio-v330.js?v=343","./assets/hsk2-audio-v330.css?v=339","./assets/hsk2-fixes-v329.css?v=329","./assets/hanzi-exact-v141.css?v=145","./assets/hanzi-exact-v141.js?v=145","./assets/hanzi-phrases-v141.js?v=141","./assets/hsk1-archive-style-v178.css?v=179","./assets/hsk1-separate-steps-v178.js?v=179","./assets/hsk1-compact-v180.css?v=180","./assets/hsk1-compact-v180.js?v=181","./assets/hsk1-coach-v181.css?v=181","./assets/hsk1-clarity-v182.css?v=182","./hsk1-first-v189.html","./assets/hsk1-first-v189.css?v=300","./assets/hsk1-first-v189.js?v=300","./assets/hsk1-native-clean-v198.js?v=198","./assets/native-owner-v200.js?v=200","./assets/lesson-viewport.js?v=237","./assets/owner-audio-v237.js?v=237","./assets/fallback-audio-v237.js?v=237","./assets/lesson-audio-source.js?v=282","./assets/hsk1-v371-ribbons.webp","./assets/panda-topic-catalog-v374.css?v=374","./assets/panda-mobile-cleanup-v378.css?v=378","./assets/panda-live-audio.mjs?v=451","./assets/hsk2-user-voice/phrase-index-v332.js?v=336","./assets/panda-voice-pilot.css?v=326","./assets/panda-ask-catalog-v326.mjs?v=436","./assets/panda-basic-conversation-v323.mjs?v=336","./assets/panda-live-dialogue-v272.mjs?v=434","./assets/panda-home-photo1-v319.css?v=319","./assets/panda-home-approved-photo1-v319.jpg","./hsk2-city-work.html","./assets/hsk2-speaking-v326.js?v=345","./assets/hsk2-premium-v352.css?v=353","./assets/hsk2-lesson1-fidelity-v356.css?v=357","./assets/hsk2-life-approved-fullscreen-v412.png","./assets/hsk2-life-welcome-v412.css?v=412","./assets/hsk2-approved-20261117/home.jpg","./assets/hsk2-approved-20261117/lesson1.jpg","./assets/hsk2-approved-20261117.css?v=432","./assets/hsk2-approved-20261117.js?v=432","./assets/panda-topics-compact-v436.css?v=436","./assets/panda-audio-study-v436.mjs?v=436","./assets/hsk2-storyboard-v433.css?v=433","./assets/hsk2-storyboard-v433-avatar.jpg","./assets/hsk2-responsive-v439.css?v=439","./assets/hsk2-viewport-v440.css?v=440","./assets/panda-error-coach-v441.mjs?v=441","./assets/hsk2-day-upgrades-v441.css?v=441","./assets/hsk2-day-upgrades-v441.js?v=443","./assets/hsk2-lilac-pink-v444.css?v=444","./assets/panda-v130.js?v=444","./assets/hsk2-home-v445.webp","./panda-tone-ma-practice.html","./assets/panda-tone-ma-pilot-v463.mjs?v=468","./assets/panda-tone-analytics-v457.mjs?v=468","./assets/panda-tone-recording-analysis-v465.mjs?v=467","./assets/hsk1-tone-practice-bridge-v463.js?v=463","./panda-tone-exercises.html","./assets/panda-tone-exercises-v469.mjs?v=469","./assets/panda-tone-lesson-entry-v469.js?v=469","./assets/hsk2-life-course-app-v1.js?v=509","./assets/hsk2-storyboard-v439.js?v=509","./assets/hsk2-grammar-review.js?v=507","./assets/hsk2-catalog-premium-v1.css?v=509","./assets/panda-approved-hanzi-ui-v129.css?v=1"];
/* v345: install the essential shell only. Audio and optional pictures remain in the repository
 * and are cached on first use or through the explicit offline-course download. */
const CORE_ART=new Set(["./assets/hsk2-home-v445.webp","./assets/panda-home-approved-photo1-v319.jpg","./assets/panda-map-scene-hd-v319.webp","./assets/panda-map-traveller-hd-v319.webp","./assets/menu-v3-approved.webp","./assets/panda-go-hero-clean-v174.webp","./assets/hanzi-approved-v141.png","./assets/panda-reference-v175/bridge.webp","./assets/panda-reference-v175/mountain-stairs.webp","./assets/hanzi-paper-v141.png","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png"]);
const INSTALL_SHELL=CORE.filter(path=>!/.\.(?:mp3|ogg)(?:\?|$)/i.test(path)&&(!/.\.(?:png|jpe?g|webp)(?:\?|$)/i.test(path)||CORE_ART.has(path)));
;;;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(INSTALL_SHELL.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Claim new pages immediately. Keep older audio caches intact; copying
 // thousands of media files during activation can prevent SW updates.
 await self.clients.claim();
})()));
async function activeCacheMatch(key){const current=await caches.open(CACHE);return await current.match(key)||await caches.match(key)}
async function network(request,timeout=12000,cache){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(request,{signal:controller.signal,cache})}finally{clearTimeout(timer)}}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
 // Local preview must reflect edits before a production version is published.
 if(['localhost','127.0.0.1','terminal.local'].includes(url.hostname))return;
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))return;
 // Never Cache.put a partial response. Keep downloaded MP3 playable offline:
 // on network failure, serve the requested bytes from a cached complete file.
 if(req.headers.has('range')){
  event.respondWith(network(req).catch(async()=>{
   const cached=await activeCacheMatch(new Request(req.url));
   if(!cached||cached.status!==200)return new Response('',{status:503});
   const bytes=await cached.arrayBuffer(),size=bytes.byteLength;
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range'));
   const invalid=()=>new Response('',{status:416,headers:{'Content-Range':'bytes */'+size}});
   if(!match||(!match[1]&&!match[2]))return invalid();
   const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
   const end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return invalid();
   const headers=new Headers(cached.headers);headers.delete('Content-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);
   headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
   return new Response(bytes.slice(start,end+1),{status:206,headers});
  }));return;
 }
 const isHome=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
 const navigation=req.mode==='navigate';
 const appCode=/\.(?:mjs|js|css)$/.test(url.pathname);
 // Pages serves the same HTML for all query parameters. Keep an offline
 // copy usable for both a direct link and a lesson step URL.
 const key=navigation?(isHome?'./index.html':url.origin+url.pathname):req;
 async function fetchAndSave(){
  const response=await network(req,12000,navigation||appCode?'no-cache':undefined);
  if(response.status===200){
   // A full cache or an interrupted write must never hide a fresh response.
   try{const cache=await caches.open(CACHE);await cache.put(key,response.clone())}catch{}
  }
  return response;
 }
 if(navigation){
  event.respondWith(fetchAndSave().catch(async()=>await activeCacheMatch(key)||await activeCacheMatch(req)||new Response('Материал ещё не сохранён. Подключи интернет и скачай его в настройках.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
 }else if(appCode){
  // Never deliver a stale JS/CSS asset for a newer ?v= URL.
  event.respondWith((async()=>{
   // Network-first even when a versioned script was cached previously.
   // A failed Pages deployment or partial cache must not freeze old code.
   try{return await fetchAndSave()}catch{return await activeCacheMatch(req)||new Response('',{status:503})}
  })());
 }else event.respondWith(activeCacheMatch(req).then(hit=>hit||fetchAndSave()).catch(()=>new Response('',{status:503})));
});
// Remove only superseded Panda chat scripts/pages after all CURRENT chat assets
// are safely saved in the new cache. Preserve human MP3, HSK1 data and progress.
const PANDA_CURRENT=['./assets/panda-live-approved-v337.webp','./assets/panda-live-approved-v337.css?v=337','./assets/panda-live-approved-v337.mjs?v=337','./panda-voice-pilot.html','./assets/panda-live-audio.mjs?v=431','./assets/hsk2-user-voice/phrase-index-v332.js?v=336','./assets/panda-live-screen-v270.mjs?v=374',
 './assets/panda-ask-catalog-v326.mjs?v=374',
 './assets/panda-basic-conversation-v323.mjs?v=336',
 './assets/panda-voice-pilot.css?v=326','./assets/panda-live-dialogue-v272.mjs?v=434','./assets/panda-hsk1-questions-v281.mjs?v=319'];
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
