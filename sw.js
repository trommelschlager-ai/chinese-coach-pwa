const CACHE='chinese-coach-pwa-v25';
const STATIC=['./','./index.html','./manifest.webmanifest','./assets/china-landscape.svg','./assets/approved-final-home.svg','./assets/approved-lessons.png','./assets/chinese-pastel-wallpaper.svg','./assets/chinese-waterfall-banner.svg','./assets/chinese-lake-vocab.svg','./assets/chinese-pavilion-dialogue.svg','./assets/chinese-painting-tones.webp','./assets/chinese-painting-greetings.webp','./assets/chinese-painting-pronouns.webp','./assets/chinese-painting-numbers.webp','./assets/chinese-painting-daily.webp','./assets/scene-tones-banner.svg','./assets/scene-tones-card.svg','./assets/scene-greetings-banner.svg','./assets/scene-greetings-card.svg','./assets/scene-pronouns-banner.svg','./assets/scene-pronouns-card.svg','./assets/scene-numbers-banner.svg','./assets/scene-numbers-card.svg','./assets/scene-daily-banner.svg','./assets/scene-daily-card.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chinese-coach-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{if(res.ok){let copy=res.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return res;}).catch(()=>caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return res;})));
});
