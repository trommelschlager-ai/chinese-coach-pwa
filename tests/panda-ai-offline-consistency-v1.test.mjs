import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pack=JSON.parse(read('assets/offline-pack.json'));
const sw=read('sw.js');
const VERSION='./assets/panda-hsk2-my-day-scenario-v1.mjs?v=538';

test('Panda AI My Day uses the same current script in both entry pages and offline manifests',()=>{
 for(const page of ['panda-voice-pilot.html','panda-ai-hsk2-preview.html']){
  const html=read(page);
  assert(html.includes(VERSION),page+' must load fixed Panda AI scenario');
  assert(!html.includes('panda-hsk2-my-day-scenario-v1.mjs?v=516'),page+' must not load stale scenario');
  const assets=[...html.matchAll(/(?:src|href)=["'](\.\/assets\/[^"']+\.(?:m?js|css)\?v=[^"']+)["']/g)].map(m=>m[1]);
  for(const asset of new Set(assets))assert(pack.files.includes(asset),'Offline pack is missing '+page+' -> '+asset);
 }
 assert(sw.includes(VERSION),'Service worker must precache the fixed scenario');
 assert(pack.files.includes(VERSION),'Offline pack must provide the fixed scenario');
 assert(pack.files.includes('./panda-ai-hsk2-preview.html'));
 const workerVersion=Number(sw.match(/^const CACHE='chinese-coach-pwa-v(\d+)-/m)?.[1]);
 assert.equal(pack.version,workerVersion,'offline pack must match active service worker cache');
});

test('shared review uses bounded install shell and complete optional download manifest',()=>{
 const shell=sw.slice(sw.indexOf('const INSTALL_SHELL'),sw.indexOf('const COURSE_SHELL'));
 const installUrls=[...shell.matchAll(/"(\.\/[^"\n]+)"/g)].map(m=>m[1]);
 assert(new Set(installUrls).size<=200,'Install shell must stay bounded');
 const activeCore=read('panda-voice-pilot.html').match(/\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0];
 assert(activeCore,'Find currently active Panda AI core from real entrypoint');
 for(const url of ["./assets/panda-hsk2-day-understanding-v1.mjs?v=6","./assets/panda-hsk2-my-day-scenario-v1.mjs?v=538",activeCore]){
  assert(installUrls.includes(url),'Missing installed asset '+url);
  assert(pack.files.includes(url),'Missing offline manifest asset '+url);
 }
 for(const url of ["./panda-ai-hsk2-preview.html","./panda-street-ai-preview.html","./assets/panda-street-shared-brain-v1.mjs?v=3","./assets/panda-street-shared-brain-v1.mjs?v=3-retry"]){
  assert(!installUrls.includes(url),'Optional entry must not expand install shell '+url);
  assert(pack.files.includes(url),'Missing downloadable asset '+url);
 }
 assert(pack.version>=555);
});
