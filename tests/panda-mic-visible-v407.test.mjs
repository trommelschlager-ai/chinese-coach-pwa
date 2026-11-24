import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const source=fs.readFileSync(new URL('../assets/panda-hsk2-preview-ui-v1.mjs',import.meta.url),'utf8');
const styles=fs.readFileSync(new URL('../assets/panda-mic-help-v407.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');

test('approved Panda UI exposes real permission and recovery controls only after a mic failure',()=>{
 assert(source.includes("const micRecovery=document.getElementById('speech-recovery')"));
 assert(source.includes("micHelp.append(micRecovery)"),'Reuse exact existing diagnostics, not a dead visual button');
 assert(source.includes("warning.append(micHelpBtn)"),'Mic recovery action is actually attached to the approved status');
 assert(source.includes("const needsMicHelp=!!micRecovery&&!micRecovery.hidden"),'No extra controls during normal chat');
 assert(source.includes("if(!needsMicHelp&&micHelp.open)micHelp.close()"),'Help closes after a successful restart');
 assert(source.includes("if(event.target===micHelp)micHelp.close()"),'Tap outside modal dismisses it');
 assert(styles.includes('#pg407-mic-help #speech-recovery.speech-recovery'));
 assert(styles.includes('min-height:44px'),'Diagnostic buttons are touch-sized');
 assert(html.includes('panda-mic-help-v407.css?v=407'));
 assert(/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/.test(html));
});

test('speech failure keeps the learner transcript fallback and provides a direct Chrome route',async()=>{
 const f=await liveDOM(1);
 try{
  const before=f.w.PandaApprovedBridge337.snapshot().history.length;
  f.el('mic').click();f.el('speech-allow').click();
  assert.equal(f.sessions.length,1);
  f.sessions[0].fail('network');
  assert.equal(f.el('speech-recovery').hidden,false);
  assert.match(f.el('speech-recovery-message').textContent,/служба распознавания/i);
  assert.equal(f.el('message').disabled,false);
  assert.match(f.el('speech-chrome').href,/https:\/\//);
  assert.equal(f.w.PandaApprovedBridge337.snapshot().history.length,before);
  f.send('你好');
  assert(f.w.PandaApprovedBridge337.snapshot().history.length>before);
 }finally{f.close()}
});

test('exact approved audio coverage: indexed cuts exist and unknown phrases never borrow a different MP3',async()=>{
 const {PANDA_CLIPS}=await import('../assets/panda-voice-clips-v365.mjs');
 const {lookupPandaVoiceClip}=await import('../assets/panda-live-audio.mjs');
 const f=await liveDOM(1);
 try{
  f.w.eval(fs.readFileSync(new URL('../assets/hsk2-user-voice/phrase-index-v332.js',import.meta.url),'utf8'));
  assert.equal(PANDA_CLIPS.length,155,'Inspect the actual uploaded recording pack');
  const seen=new Set();
  for(const clip of PANDA_CLIPS){
    const key=clip.src.slice(2);
    assert(fs.existsSync(new URL('../'+key,import.meta.url)),key);
    const found=lookupPandaVoiceClip(clip.zh);
    assert(found?.src,'Exact phrase should have a verified MP3: '+clip.zh);
    assert.equal(found.start,0,'Dedicated cut must not seek inside a larger file');
    seen.add(clip.file);
  }
  assert.equal(seen.size,10,'Ten original November 14 recordings are represented');
  assert.equal(lookupPandaVoiceClip('我正在驾驶火箭去月球'),null);
 }finally{f.close()}
});
