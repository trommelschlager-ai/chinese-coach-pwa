import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {lookupApprovedPandaVoice,voiceNorm} from '../assets/panda-approved-voice-registry-v516.mjs';
import {PANDA_V422_VOICE} from '../assets/qa-v411/panda-voice-v422.mjs';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {PANDA_CLIPS} from '../assets/panda-voice-clips-v365.mjs';
import {PILOT_AUDIO} from '../assets/panda-live-audio.mjs';

const read = path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pending = JSON.parse(read('assets/panda-ai-xiaoxiao-pending-20261122.json'));

test('The correct Xiaoxiao profile is documented, without reassigning lesson audio',()=>{
  assert.equal(pending.voice.display_name,'Xiaoxiao');
  assert.equal(pending.voice.provider,'Luvvoice');
  assert.equal(pending.voice.voice_id,'voice-093');
  assert.equal(pending.voice.pitch,0);
  assert.equal(pending.voice.volume,0);
  assert.equal(pending.policy.keep_existing_approved_mp3,true);
  assert.equal(pending.policy.do_not_fallback_to_browser_tts,true);
  const trainer=read('scripts/generate_panda_xiaoxiao_trainer.py');
  assert.match(trainer,/VOICE\s*=\s*["']voice-093["']/);
  assert.match(trainer,/RATE\s*=\s*-20/,'Trainer speed is separate from conversational reference');
});

test('Five user-supplied Xiaoxiao MP3s match exact text, hashes, and audio registry',()=>{
  assert.equal(pending.items.length,5);
  assert.equal(pending.status,'five-user-supplied-recordings-uploaded-exact-transcript-verified');
  const unique=new Set();
  for(const x of pending.items){
    assert.match(x.filename,/^panda0[1-5]\.mp3$/);
    assert.ok(x.pinyin.length>8 && x.ru.length>9);
    const key=voiceNorm(x.zh);
    assert(!unique.has(key),'Duplicate phrase');unique.add(key);
    const approved=lookupApprovedPandaVoice(x.zh);
    assert.equal(approved?.src, './'+pending.output_folder+'/'+x.filename);
    assert.match(approved.source,/xiaoxiao/);
    assert.equal(x.status,'exact-mp3-loaded-native-tone-review-pending');
    const data=fs.readFileSync(new URL('../'+pending.output_folder+'/'+x.filename,import.meta.url));
    assert.equal(data.length,x.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'),x.sha256);
    assert(data.length>1000,'Audio file unexpectedly short');
    assert.equal(data[0],0xff,'MP3 frame sync first byte');
    assert.equal(data[1]&0xe0,0xe0,'MP3 frame sync marker');
  }
});


test('All current voice routes remain exact and confined to the approved Panda voice registry',()=>{
  const reg=read('assets/panda-approved-voice-registry-v516.mjs');
  const m=reg.match(/const APPROVED_HSK2=Object\.freeze\((\{[\s\S]*?\})\);/);
  assert(m,'HSK2 approved voice map not found');
  const hsk2=JSON.parse(m[1]);
  const keys=new Set([
    ...Object.keys(hsk2),
    ...PANDA_V422_VOICE.map(x=>x.zh),
    ...PANDA_V411_VOICE.map(x=>x.zh),
    ...PANDA_CLIPS.map(x=>x.zh),
    ...Object.keys(PILOT_AUDIO),
    ...[...reg.matchAll(/"zh"\s*:\s*"([^"]+)"/g)].map(x=>x[1])
  ]);
  let checked=0;
  for(const text of keys) {
    const clip=lookupApprovedPandaVoice(text);
    if(!clip)continue;
    checked++;
    assert.equal(typeof clip.src,'string',text);
    assert(clip.src.startsWith('./assets/'),'Only existing reviewed MP3 assets may play: '+text);
    assert(clip.src.endsWith('.mp3'),'No synthesized fallback or generic audio: '+text);
    assert(!/\/panda-xiaoxiao-trainer-v250\/|\/lesson[1-7]-xiaoxiao|\/panda-lesson2-xiaoxiao|\/hsk1-human-voice|\/owner-clean|\/panda-street/i.test(clip.src),
      'Do not silently substitute lesson, human or Panda Street clips: '+text+' => '+clip.src);
  }
  assert(checked>200,'Voice inventory unexpectedly small; reviewed routing may have regressed');
});

test('Conversation uses exact MP3; no browser-generated voice substitution',()=>{
  const active=[
    read('assets/panda-hsk2-preview-core-v1.mjs'),
    read('assets/panda-hsk2-preview-ui-v1.mjs'),
    read('assets/panda-approved-voice-registry-v516.mjs'),
    read('assets/panda-live-audio.mjs')
  ].join('\n');
  assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(active),'Unexpected browser TTS');
  assert.equal(lookupApprovedPandaVoice('我想帮助更多人学习中文。')?.src,'./assets/panda-context-voice-20261122/chat01.mp3');
  assert.equal(lookupApprovedPandaVoice('你今天有空吗？')?.src,'./assets/panda-voice-clips-v411/p164.mp3');
  assert.equal(lookupApprovedPandaVoice('我刚编了一句不存在的台词。'),null);
});
