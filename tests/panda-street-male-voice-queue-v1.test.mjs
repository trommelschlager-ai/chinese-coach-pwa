import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('panda-street-ai-preview.html',root),'utf8');
const queue=JSON.parse(fs.readFileSync(new URL('assets/panda-street-male-voice-queue-v1.json',root),'utf8'));
const normalize=s=>String(s).normalize('NFC').replace(/[\s。，！？?!,]/g,'');
const audioKeys=[...html.match(/const MALE_CUES=Object\.freeze\(\{([\s\S]*?)\}\);/)[1].matchAll(/'([^']+)':\[/g)].map(m=>m[1]);

test('approved male audio stays unchanged with existing 14 indexed segments',()=>{
 assert.equal(audioKeys.length,14);
 assert.equal(new Set(audioKeys).size,audioKeys.length);
 assert.match(html,/const MALE_VOICE='\.\/assets\/panda-street-lesson1-luvvoice\.m4a'/);
 assert.match(html,/if\(!cue\)\{/);
 assert.match(html,/Фраза показана текстом · мужская запись для неё пока не загружена/);
 assert.doesNotMatch(html,/speechSynthesis|SpeechSynthesisUtterance/);
});
test('new male voice queue matches 18 missing unique phrases from current Street screen',()=>{
 const expected=[];
 for(const [section,category] of [['cues','home-preview'],['replies','legacy-fallback'],['dayQuestions','legacy-my-day']]){
  const match=html.match(new RegExp('const '+section+'=\\[([\\s\\S]*?)\\];'));
  assert.ok(match,section+' missing');
  for(const row of match[1].matchAll(/zh:'([^']+)',py:'([^']+)',ru:'([^']+)'/g)){
   const hanzi=row[1],key=normalize(hanzi);
   if(audioKeys.includes(key)||expected.some(x=>normalize(x.hanzi)===key))continue;
   expected.push({hanzi,pinyin:row[2],russian:row[3],category});
  }
 }
 assert.equal(expected.length,18);
 assert.equal(queue.phrases.length,expected.length);
 assert.deepEqual(queue.phrases.map(x=>[x.hanzi,x.pinyin,x.russian,x.category]),
  expected.map(x=>[x.hanzi,x.pinyin,x.russian,x.category]));
 assert.equal(queue.phrases.filter(x=>x.priority==='P0').length,6);
 assert.equal(queue.phrases.filter(x=>x.priority==='P1').length,7);
 assert.equal(queue.phrases.filter(x=>x.priority==='P2').length,5);
});
test('queue is only a recording checklist, not imaginary approved new clips',()=>{
 for(const row of queue.phrases){
  const index=Number(row.id.slice(-2));
  if(index<=3){
   assert.equal(row.status,'native-speaker-approved-active-in-pr');
   assert.equal(row.nativeApprovalDate,'2026-11-23');
   assert.match(row.mp3Sha256,/^[a-f0-9]{64}$/);
   const filePath=new URL(row.audioPath,root);
   assert.equal(fs.existsSync(filePath),true,'approved audio missing: '+row.audioPath);
   assert.equal(fs.statSync(filePath).size,row.mp3Bytes);
  }else {
   assert.equal(row.status,'awaiting-approved-male-luvvoice');
   assert.equal(fs.existsSync(new URL(row.audioPath,root)),false,'audio unexpectedly present: '+row.audioPath);
  }
  assert.ok(!audioKeys.includes(normalize(row.hanzi)));
 }
 assert.match(queue.warning,/not exhaustive coverage/);
});
