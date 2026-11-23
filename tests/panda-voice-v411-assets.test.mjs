import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {lookupPandaVoiceClip,lookupPilotAudio} from '../assets/panda-live-audio.mjs';
const hashes=["3387af68c491e038950a35eb519047eaa9b0b30f37104c6f0e16cbcd03aebd6a","9f13eeb722395f538a3624a2c0fbef532a247777657918772b38833c0e3754b3","c65c9af0dc259259c6ed2b2d331f7b2fe365b28d603f2647eed835ba77efb265","75df86d23b94a5e9ecddafe20e3e9a55f924259d59b49f09ff3cce14af8d9f32","71af20e32e0a5b0cb94e3e001e6db5713254ded772a479dbcd791a079b3996ef","1f5caa478ac3be6df17367b84ee6dbccf500dd541022e1609720f9f845ce6a0d","0e11a0ba8d9cebfa330ebd8ea9d5c8d430bf2d42567b159709037d3d3ff0acfd","687600ba912818677c5082d2dae263c1a58c3e9a869b0df40f54dd7d4b06852f","0aacfa6fc7c331855580579f543b0e5fa87dc3128af42d7a0c647913a2228465","43b4c3c86fe99794ff60e58734a7c590682e6ad580f5e50df560884adb69358f"];
test('v411 has exactly ten original MP3 files with matching SHA-256 and dialogue mapping',()=>{
 assert.equal(PANDA_V411_VOICE.length,10);
 assert.equal(new Set(PANDA_V411_VOICE.map(x=>x.zh)).size,10);
 for(let i=0;i<10;i++){
  const entry=PANDA_V411_VOICE[i],src=`./assets/panda-voice-clips-v411/p${i+156}.mp3`;
  assert.equal(entry.src,src);
  const path=new URL('../'+src.slice(2),import.meta.url);
  const bytes=fs.readFileSync(path);
  assert(bytes.length>3000);
  assert.equal(bytes.subarray(0,3).toString('ascii'),'ID3');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hashes[i]);
  assert.equal(lookupPilotAudio(entry.zh),src);
  assert.deepEqual(lookupPandaVoiceClip(entry.zh+'。'),{src,start:0,end:null,source:'user-luvvoice-nov16-cut'});
  assert(entry.pinyin&&entry.ru);
 }
});
test('existing Panda voices and no false sound remain',()=>{
 for(const zh of ['你好','你好吗','谢谢','你做什么工作']){
  const result=lookupPandaVoiceClip(zh);
  assert(result&&result.src.endsWith('.mp3'));
  assert.notEqual(result.source,'user-luvvoice-nov16-cut');
 }
 assert.equal(lookupPandaVoiceClip('没有录音的句子'),null);
});
test('active mobile core and UI use the same exact approved Panda voice mapping',()=>{
 const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const core=read('assets/panda-hsk2-preview-core-v1.mjs');
 const ui=read('assets/panda-hsk2-preview-ui-v1.mjs');
 const html=read('panda-voice-pilot.html');
 assert.match(core,/panda-hsk2-preview-audio-v1\.mjs\?v=\d+/,'Active core must load approved recording registry');
 assert.match(ui,/panda-hsk2-preview-audio-v1\.mjs\?v=\d+/,'Active UI must use the same recording registry');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/,'Current core must be cache-versioned');
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/,'Current UI must be cache-versioned');
});
