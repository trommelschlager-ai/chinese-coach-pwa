import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {lookupPandaVoiceClip} from '../assets/panda-hsk2-preview-audio-v1.mjs';
import {correctPandaGrammarV2} from '../assets/panda-grammar-hsk12-v2.mjs';

const src=fs.readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
const start=src.indexOf('function recordCorrection(input,spoken){');
const end=src.indexOf('function showLearnerFeedback(spoken){',start);
assert.ok(start>0&&end>start,'Find correction function safely');
const fn=src.slice(start,end);
function harness(lookup=lookupPandaVoiceClip){
 const logs={records:[],plays:[]};
 const scope={
  record:(...args)=>logs.records.push(args),
  play:line=>logs.plays.push(line),
  lookupPandaVoiceClip:lookup
 };
 const run=vm.runInNewContext(fn+'\nrecordCorrection;',scope);
 return {logs,run};
}

test('auto-plays newly recorded corrected sentences with exact, verified MP3',()=>{
 for(const [wrong,expected,mp3] of [
   ['他有二个妹妹','他有两个妹妹。','g001.mp3'],
   ['她是不是医生吗','她是不是医生？','g002.mp3'],
   ['你起床八点','你八点起床。','g003.mp3']
 ]){
  const corrected=correctPandaGrammarV2(wrong);
  const c=corrected?.spoken?.correction;
  assert.equal(c?.hanzi,expected);
  assert.ok(lookupPandaVoiceClip(expected)?.src.endsWith(mp3));
  const {logs,run}=harness();run(wrong,corrected.spoken);
  assert.equal(logs.records.length,1);
  assert.equal(logs.records[0][0],'example');
  assert.equal(logs.records[0][1],expected);
  assert.equal(logs.plays.length,1,'Voice starts without tapping the speaker');
  assert.equal(logs.plays[0].hanzi,expected);
  assert.notEqual(logs.plays[0].hanzi,wrong);
 }
});

test('never autoplays a low-confidence transcription or missing phrase',()=>{
 const uncertain=correctPandaGrammarV2('他有二个妹妹',{confidence:.74});
 assert.equal(uncertain?.spoken?.correction?.uncertain,true);
 const a=harness();a.run('他有二个妹妹',uncertain.spoken);
 assert.equal(a.logs.records.length,1);assert.equal(a.logs.plays.length,0);
 const good=correctPandaGrammarV2('他有二个妹妹');
 const b=harness(()=>null);b.run('他有二个妹妹',good.spoken);
 assert.equal(b.logs.records.length,1);assert.equal(b.logs.plays.length,0);
 const c=harness();c.run('你好',{known:true});
 assert.equal(c.logs.records.length,0);assert.equal(c.logs.plays.length,0);
});

test('existing Panda player handles playback, not a new voice or microphone request',()=>{
 assert.ok(fn.includes('play({hanzi:c.hanzi,audioKey:c.hanzi})'));
 assert.ok(fn.includes('lookupPandaVoiceClip(c.hanzi)'));
 assert.ok(!fn.includes('startRecognition('));
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 assert.ok(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/.test(html));
 assert.ok(/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/.test(html));
});
