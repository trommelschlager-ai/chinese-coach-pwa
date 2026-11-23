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
