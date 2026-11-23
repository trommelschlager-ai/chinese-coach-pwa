import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {friendlyIntroduction} from '../assets/panda-everyday-meaning-v515.mjs';

test('learner love -> polite response and question about name',()=>{
 const out=friendlyIntroduction('我爱你！',null);
 assert.equal(out.spoken[0],'Wǒ ài nǐ!');
 assert.equal(out.reply[0],'谢谢你！我很开心！你叫什么名字？');
 assert.equal(out.reply[1],'Xièxie nǐ! Wǒ hěn kāixīn! Nǐ jiào shénme míngzi?');
 assert.equal(out.next,'name');
});
test('name -> contextual mood question, and mood -> followup',()=>{
 const name=friendlyIntroduction('我叫小明。','name');
 assert.equal(name.spoken[0],'Wǒ jiào Xiǎomíng.');
 assert.equal(name.reply[0],'很高兴认识你！你今天怎么样？');
 assert.equal(name.next,'mood');
 const mood=friendlyIntroduction('我很好。',name.next);
 assert.equal(mood.reply[0],'太好了！你想聊什么？');
});
test('no invented pronunciation for unknown learner names',()=>{
 const out=friendlyIntroduction('我叫阿乐','name');
 assert.equal(out.spoken[0],null);
 assert.equal(out.spoken[1],'Меня зовут 阿乐.');
});
test('unrelated text cannot steal the user from current lesson',()=>{
 assert.equal(friendlyIntroduction('我叫小明',null),null);
 assert.equal(friendlyIntroduction('我喜欢熊猫',null),null);
});
test('entrypoint, offline manifest and worker publish matching new version',()=>{
 const html=fs.readFileSync('panda-voice-pilot.html','utf8');
 const sw=fs.readFileSync('sw.js','utf8');
 const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
 const files=[
  './assets/panda-hsk2-preview-v506.css?v=535',
  './assets/panda-hsk2-preview-core-v1.mjs?v=535',
  './assets/panda-hsk2-preview-ui-v1.mjs?v=535',
  './assets/panda-everyday-meaning-v515.mjs?v=535'
 ];
 for(const src of files){
  assert(pack.files.includes(src),'Offline pack missing '+src);
  if(!src.includes('everyday-meaning'))assert(html.includes(src),'Entrypoint missing '+src);
  assert(sw.includes(src),'Service worker missing '+src);
 }
 assert.match(sw,/^const CACHE='chinese-coach-pwa-v535-panda-friendly-chat';/m);
 assert.equal(pack.version,535);
});
