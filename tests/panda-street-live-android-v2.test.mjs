import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createStreetBrain} from '../assets/panda-street-shared-brain-v1.mjs';
import {streetFacePlacement,streetMouthOpenness,createStreetFaceRig} from '../assets/panda-street-face-rig-v1.mjs';
const source=fs.readFileSync(new URL('../panda-street-ai-preview.html',import.meta.url),'utf8');
const brainSource=fs.readFileSync(new URL('../assets/panda-street-shared-brain-v1.mjs',import.meta.url),'utf8');
function storage(){
 const store=new Map();
 return {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
}

test('the approved Panda Street character artwork and proportional render still exist',()=>{
 assert.match(source,/data:image\/png;base64,/);
 assert.match(source,/const W=693,H=1444/);
 assert.match(source,/s=width\/W/);
 assert.match(source,/Uniform scaling ONLY/);
 assert.match(source,/c\.drawImage\(src/);
 assert.match(source,/id="art"/);
});
test('the existing layout buttons are still present and connected',()=>{
 for(const id of ['short','nonstop','history','topics','book','send','mic','profile','live-panda','live-learner']){
  assert.match(source,new RegExp('id="'+id+'"'),id+' absent');
 }
 assert.match(source,/el\('profile'\)\.onclick=\(\)=>location\.assign\('\.\/panda-shared-profile-settings\.html'\)/);
 assert.match(source,/streetBrainPromise=import\('\.\/assets\/panda-street-shared-brain-v1\.mjs/);
});
test('microphone requires an explicit disclosure and never claims tone grading',()=>{
 assert.match(source,/let streetRecognition=null,streetMicConsent=false/);
 assert.match(source,/браузер Chrome/);
 assert.match(source,/может отправлять звук своей службе распознавания/);
 assert.match(source,/function stopStreetRecognition\(/);
 assert.match(source,/if\(streetRecognition\)\{stopStreetRecognition\(true\);return\}/);
 assert.match(source,/rec\.lang='zh-CN'/);
 assert.match(source,/if\(e\.results\[i\]\.isFinal\)/);
 assert.match(source,/не является проверкой тонов/);
 assert.doesNotMatch(source,/speechSynthesis|SpeechSynthesisUtterance/);
});
test('male approved Luvvoice only, and no invented audio for missing phrase',()=>{
 assert.match(source,/MALE_VOICE='\.\/assets\/panda-street-lesson1-luvvoice\.m4a'/);
 assert.match(source,/if\(!cue\)\{/);
 assert.match(source,/lookupApprovedStreetMaleMp3\(text\)/);
 assert.match(source,/Фраза показана текстом · мужская запись для неё пока не загружена/);
 assert.doesNotMatch(source,/new Audio\(['"].*xiaoxiao/i);
});
test('the Street brain responds to natural everyday Chinese and uses common HSK code',()=>{
 const brain=createStreetBrain({storage:storage()});
 assert.equal(brain.start('nonstop').zh,'哈喽！最近怎么样？');
 const res=brain.answer('还行吧',{mode:'nonstop'});
 assert.equal(res.kind,'answer');
 assert.equal(res.panda.zh,'挺好的！');
 assert.equal(brain.nextQuestion()?.zh,'你呢？');
 assert.match(brainSource,/from '\.\/panda-live-dialogue-v272\.mjs/);
 assert.match(brainSource,/from '\.\/panda-cross-character-memory-v1\.mjs/);
});


test('face rig uses the existing approved photo and follows uniform canvas crop',()=>{
 assert.match(source,/import\('\.\/assets\/panda-street-face-rig-v1\.mjs\?v=1'\)/);
 assert.match(source,/streetFaceRig\?\.resize\(\{width,height,scale:s,left:stageX,cutSky:removedSky\}\)/);
 assert.match(source,/streetFaceRig\?\.setState\('listening'\)/);
 assert.match(source,/streetFaceRig\?\.setState\('talking'\)/);
 assert.match(source,/streetFaceRig\?\.talk\(/);
 assert.deepEqual(streetFacePlacement({scale:.5,left:12,cutSky:30},318,609),{x:171,y:289.5});
 assert.equal(streetMouthOpenness(0),0);
 assert.ok(streetMouthOpenness(.9,20)>.4);
 assert.ok(streetMouthOpenness(9,0)<=1);
});
test('face rig is a transparent, noninteractive animation layer and can be stopped',()=>{
 const calls=[];
 const ctx={
  setTransform:()=>calls.push('transform'),clearRect:()=>calls.push('clear'),
  translate:()=>calls.push('translate'),scale:()=>calls.push('scale'),
  save:()=>{},restore:()=>{},beginPath:()=>{},ellipse:()=>calls.push('ellipse'),
  fill:()=>calls.push('fill'),
  createRadialGradient:()=>({addColorStop:()=>{}})
 };
 const canvas={style:{},getContext:()=>ctx,setAttribute:()=>{},remove:()=>calls.push('remove'),width:0,height:0};
 const doc={createElement:()=>canvas,hidden:false};
 const stage={ownerDocument:doc,appendChild:()=>calls.push('append'),clientWidth:693,clientHeight:1444};
 const rig=createStreetFaceRig({stage,source:{naturalWidth:693}});
 assert.equal(canvas.style.pointerEvents,'none');
 assert.equal(canvas.style.zIndex,'1');
 rig.resize({width:693,height:1444,scale:1,left:0,cutSky:0});
 rig.setState('talking');rig.talk(.7);
 assert.equal(rig.getState(),'talking');
 assert.ok(calls.includes('ellipse'));
 rig.setState('listening');
 assert.equal(rig.getState(),'listening');
 rig.destroy();
 assert.ok(calls.includes('remove'));
});
