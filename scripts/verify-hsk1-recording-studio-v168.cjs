'use strict';
/* v168 native-voice studio: content and safety checks. The studio makes no voice without a human performer. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const queue=JSON.parse(fs.readFileSync('assets/hsk1-native-recording-queue-v168.json','utf8'));
const doc=fs.readFileSync('docs/HSK1-NATIVE-VOICE-GAPS-v167.md','utf8');
assert.equal(queue.version,168);
assert.equal(queue.recordings_exist,false);
assert.equal(queue.no_voice_cloning,true);
assert.equal(queue.items.length,56);
assert.equal(queue.original_missing_slots,65);
const unique=new Set(queue.items.map(x=>x.hanzi));
assert.equal(unique.size,56,'No duplicate normalized Chinese phrases');
const norm=s=>s.replace(/[。？！!?.,，\s]/g,'');
const lines=doc.split('\n').filter(x=>x.startsWith('| ')&&!x.startsWith('| Китайский')).map(x=>x.split('|')[1].trim());
assert.equal(lines.length,65);
assert.deepEqual([...unique].sort(),[...new Set(lines.map(norm))].sort(),'Exact 56 missing text keys must match source');
let variants=0;
for(const item of queue.items){
 assert(/^\d{3}$/.test(item.id)&&item.recording_filename===item.id+'.webm');
 assert.equal(item.status,'recording_required');
 assert.equal(item.qa,'native_mandarin_tones_pending');
 assert.equal(item.pinyin_reviewed,false);
 assert(item.pinyin_reference&&item.used_in.length);
 for(const phrase of item.variants){assert.equal(norm(phrase),item.hanzi);variants++;}
}
assert.equal(variants,65);
const p=fs.readFileSync('hsk1-recording-studio.html','utf8');
assert(p.includes("getUserMedia"),'Web capture must explicitly ask for microphone');
assert(p.includes("MediaRecorder"),'Record locally, not to a cloud TTS');
assert(p.includes('zipStore'), 'Must permit a single ZIP export');
assert(p.includes("NEEDS_SIGNED_PERMISSION"),'No rights verification claims');
assert(p.includes("verified_by_native:false"),'No phonetics verification claims');
assert(!p.includes('speechSynthesis')&&!p.includes('edge-tts'),'No synthetic voice generation');
assert(!p.includes("fetch('https://")&&!p.includes('WebSocket'),'No upload of audio to external services');
const src=(p.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(src&&src.length>2000,'Studio JS absent');
new Function(src); // syntax only
const dom=new JSDOM(p,{url:'https://panda.test/hsk1-recording-studio.html',runScripts:'outside-only',pretendToBeVisual:true});
dom.window.TextEncoder=require('node:util').TextEncoder; // jsdom's sandbox omits the browser TextEncoder global
dom.window.fetch=async()=>({ok:true,json:async()=>queue});
dom.window.eval(src);
setTimeout(()=>{
 try{
  const d=dom.window.document;
  assert.equal(d.querySelectorAll('#list button').length,56,'Every phrase must be individually selectable');
  assert(d.querySelector('#word').textContent.length>0,'First phrase missing');
  assert(d.querySelector('#record').disabled,'Browser without microphone should be display-only');
  d.querySelector('#list button:nth-child(56)').click();
  assert.equal(d.querySelector('#word').textContent,queue.items[55].display);
  assert.equal(d.querySelector('#count').textContent,'0 из 56 записано');
  assert(d.querySelector('#export').disabled,'Cannot export empty/unrecorded takes');
  console.log('PASS v168: 56 exact human recording slots, 65 original variants, local-only studio, Zip export UI, missing-mic browser mode.');
  dom.window.close();
 }catch(e){console.error(e);process.exitCode=1}
},15);
