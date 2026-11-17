import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pack=JSON.parse(read('assets/offline-pack.json'));
const active=[
 'hsk1-map.html','hsk1-first-v189.html','hsk1-second-v203.html',
 'hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html',
 'hsk1-lesson.html','panda-voice-pilot.html','hsk2-life-course.html'
];
test('every versioned JS/CSS reference on active learning screens is offline',()=>{
 for(const page of active){
  const html=read(page);
  const urls=[...html.matchAll(/(?:src|href)=["'](\.\/assets\/[^"']+\.(?:m?js|css)\?v=[^"']+)["']/g)].map(x=>x[1]);
  assert(urls.length>0,'No executable/style references found on '+page);
  for(const url of new Set(urls)){
   assert(fs.existsSync(path.join(root,url.slice(2).split('?')[0])),'Broken lesson dependency '+page+' -> '+url);
   assert(pack.files.includes(url),'Missing offline file '+page+' -> '+url);
  }
 }
});
test('active cache version matches the offline release manifest',()=>{
 const sw=read('sw.js');
 const activeVersion=Number(sw.match(/^const CACHE='chinese-coach-pwa-v(\d+)-/m)?.[1]);
 assert.equal(activeVersion,pack.version);
 assert.equal(pack.version>=434,true);
});
