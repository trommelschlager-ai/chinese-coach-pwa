import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
const layer=readFileSync(new URL('../assets/panda-live-v346.mjs',import.meta.url),'utf8');
const engine=readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/panda-live-effects-v352.css',import.meta.url),'utf8');

test('live page loads the additional effects without replacing the approved art',()=>{
  assert.match(html,/panda-live-effects-v352\.css\?v=352/);
  assert.match(layer,/panda-character-clean-v349\.webp\?v=349/);
  assert.match(layer,/pg352-rocks/);
  assert.match(layer,/pg352-mascot/);
  assert.match(layer,/pg352-mouth/);
  assert.match(layer,/pg352-ear-effects/);
  assert.match(layer,/pg346-short/);
  assert.match(layer,/pg346-nonstop/);
  assert.match(layer,/pg346-mic/);
  assert.match(layer,/pg346-history/);
});

test('mouth activity follows the playing pose, not a cosmetic timer alone',()=>{
  assert.match(layer,/pandaSpeaking=historySpeaking\|\|s\.pose==='talking'/);
  assert.match(css,/#pg346\[data-pose=talking\] \.pg352-mouth/);
  assert.match(css,/#pg346\[data-pose=talking\] \.pg352-mascot/);
  assert.match(layer,/a\.onplaying=\(\)=>\{if\(historyAudio===a\)sync\(\)\}/);
});

test('headphones show listening, conservative correction, and green only after genuine tone validation',()=>{
  assert.match(layer,/stage\.dataset\.headphones=s\.active\?'listening':headsetResult/);
  assert.match(css,/#pg346\[data-headphones=listening\]/);
  assert.match(css,/#pg346\[data-headphones=correct\]/);
  assert.match(css,/#pg346\[data-headphones=error\]/);
  assert.match(layer,/signal\.kind==='verified-tones'&&signal\.toneVerified===true&&signal\.contentVerified===true/);
  assert.match(engine,/contentVerified:false,toneVerified:false/);
  assert.match(engine,/confidence:state\.confidence/);
  assert.match(layer,/Китайские тоны не проверены/);
});

test('the existing background and audio selections stay unchanged',()=>{
  assert.match(html,/panda-live-scenic-v350\.css/);
  assert.match(layer,/lookupPandaVoiceClip/);
  assert.match(layer,/clipFor\(\{hanzi:signal\.correctionHanzi\}\)/);
  assert.match(css,/#pg346 \.pg352-rocks\{/);
});
