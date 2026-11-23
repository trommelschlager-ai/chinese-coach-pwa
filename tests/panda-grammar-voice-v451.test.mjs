import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {PANDA_GRAMMAR_AUDIO_V451} from '../assets/panda-grammar-voice-v451.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const norm=s=>String(s).normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const manifest=JSON.parse(read('assets/panda-grammar-voice-manifest-v451.json'));

test('all 42 approved phrases map one-to-one to actual MP3 files',()=>{
 assert.equal(manifest.items.length,42);
 assert.equal(Object.keys(PANDA_GRAMMAR_AUDIO_V451).length,42);
 const seen=new Set();
 for(const [i,row] of manifest.items.entries()){
   assert.equal(row.id,i+1);
   assert.equal(row.file,'g'+String(i+1).padStart(3,'0')+'.mp3');
   const key=norm(row.hanzi);
   assert.ok(!seen.has(key),'Duplicate sentence: '+key);seen.add(key);
   const src='./assets/panda-grammar-voice-v451/'+row.file;
   assert.equal(PANDA_GRAMMAR_AUDIO_V451[key],src,'Wrong clip: '+row.hanzi);
   const found=lookupPandaVoiceClip(row.hanzi);
   assert.equal(found?.src,src,row.hanzi);
   assert.equal(found?.source,'user-luvvoice-grammar-v451',row.hanzi);
   const bytes=fs.readFileSync(path.join(root,'assets/panda-grammar-voice-v451',row.file));
   assert.ok(bytes.length>3000,'Empty clip '+row.file);
   assert.ok(bytes.toString('ascii',0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224,'Invalid MP3 header '+row.file);
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256,'Clip differs from original segmentation: '+row.file);
   assert.ok(row.pinyin&&row.ru&&row.duration_s>0.8);
 }
});

test('three Android screenshot corrections have playable exact audio',()=>{
 const samples=[
 ['他有两个妹妹。','g001.mp3'],
 ['她是不是医生？','g002.mp3'],
 ['你八点起床。','g003.mp3']
 ];
 for(const [line,file] of samples){
  assert.equal(lookupPandaVoiceClip(line)?.src,'./assets/panda-grammar-voice-v451/'+file);
 }
});

test('wrong sentences cannot play a correct example as though it were the original',()=>{
 for(const line of ['他有二个妹妹','她是不是医生吗','你起床八点']){
  assert.equal(lookupPandaVoiceClip(line),null,'Must not play incorrect grammar in a correct-audio slot: '+line);
 }
 assert.equal(lookupPandaVoiceClip('他有两个妹妹他有两个妹妹'),null);
});

test('existing user Luvvoice voice and offline versions are preserved',()=>{
 assert.equal(lookupPandaVoiceClip('我很好')?.src,'./assets/panda-voice-clips-v411/p156.mp3');
 assert.equal(lookupPandaVoiceClip('你好')?.src,'./assets/panda-voice-clips-v365/p039.mp3');
 const pack=JSON.parse(read('assets/offline-pack.json'));
 assert.ok(pack.version>=451,'Audio pack must include at least v451');
 for(const row of manifest.items){
  assert.ok(pack.files.includes('./assets/panda-grammar-voice-v451/'+row.file),'Offline entry missing: '+row.file);
 }
 const html=read('panda-voice-pilot.html');
 const core=read('assets/panda-hsk2-preview-core-v1.mjs');
 const ui=read('assets/panda-hsk2-preview-ui-v1.mjs');
 const registry=read('assets/panda-approved-voice-registry-v516.mjs');
 const audio=read('assets/panda-live-audio.mjs');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/);
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/);
 assert.match(core,/panda-hsk2-preview-audio-v1\.mjs\?v=\d+/);
 assert.match(ui,/panda-hsk2-preview-audio-v1\.mjs\?v=\d+/);
 assert.match(registry,/panda-live-audio\.mjs\?v=\d+/);
 assert.ok(audio.includes('PANDA_GRAMMAR_AUDIO_V451'),'Original reviewed Luvvoice grammar recordings remain mapped');
});
