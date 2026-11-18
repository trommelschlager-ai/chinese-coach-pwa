import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {estimatePitch,analyseContour,semitones} from '../assets/panda-tone-analytics-v457.mjs';

const sr=48000;
function wave(hz=160,amp=.25,noise=0){
 const a=new Float32Array(4096);
 for(let i=0;i<a.length;i++)a[i]=amp*Math.sin(2*Math.PI*hz*i/sr)+(noise?noise*(Math.sin(i*7.77)+Math.cos(i*3.1)):.0);
 return a;
}
function path(fn,n=35){return Array.from({length:n},(_,i)=>({t:i*.038,hz:fn(i/(n-1))}));}
test('pitch YIN estimates a plausible periodic f0 without using recognized text',()=>{
 for(const hz of [92,120,170,220,320,440]){
  const found=estimatePitch(wave(hz),sr);
  assert.ok(found,'No pitch for '+hz);
  assert.ok(Math.abs(found.hz-hz)<hz*.06,'Unexpected '+found.hz+' for '+hz);
  assert.ok(found.clarity>.78);
 }
});
test('no voice / invalid inputs never fabricate a frequency',()=>{
 assert.equal(estimatePitch(new Float32Array(4096),sr),null);
 assert.equal(estimatePitch(new Float32Array(256),sr),null);
 assert.equal(estimatePitch(new Float32Array(4096),5000),null);
});
test('classifies synthetic rising, dipping and falling *shapes*, never correctness',()=>{
 const rise=analyseContour(path(p=>145+75*p));
 assert.equal(rise.kind,'rise');
 assert.equal(rise.isToneGrade,false);
 assert.ok(rise.points.length>10);
 const dip=analyseContour(path(p=>p<.5?180-65*p*2:115+75*(p-.5)*2));
 assert.equal(dip.kind,'dip');
 assert.equal(dip.isToneGrade,false);
 const fall=analyseContour(path(p=>220-85*p));
 assert.equal(fall.kind,'fall');
 const level=analyseContour(path(()=>175));
 assert.equal(level.kind,'level');
});
test('short contours and gaps do not get a grade',()=>{
 assert.equal(analyseContour(path(p=>140+60*p,5)).kind,'insufficient');
 const separated=[...path(p=>140+30*p,7),...path(p=>180+15*p,7).map(x=>({...x,t:x.t+2}))];
 assert.equal(analyseContour(separated).kind,'insufficient');
 assert.equal(analyseContour(null).kind,'insufficient');
 assert.ok(Number.isFinite(semitones(160,170)));
});
test('pilot page only uses local Web Audio and never claims verified tones',()=>{
 const html=fs.readFileSync(new URL('../panda-tone-lab.html',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../assets/panda-tone-lab-ui-v457.mjs',import.meta.url),'utf8');
 assert.ok(html.includes('panda-tone-lab-ui-v457.mjs?v=457'));
 assert.ok(html.includes('не оценивает правильность китайских тонов'));
 assert.ok(html.includes('panda-voice-pilot.html'));
 assert.ok(ui.includes('getUserMedia('));
 assert.ok(ui.includes('getFloatTimeDomainData('));
 assert.ok(ui.includes('estimatePitch('));
 assert.ok(ui.includes('analyseContour(frames)'));
 assert.ok(ui.includes('getTracks().forEach(t=>t.stop())'));
 for(const banned of ['fetch(', 'XMLHttpRequest','WebSocket','MediaRecorder','SpeechRecognition','localStorage','sessionStorage']){
  assert.ok(!ui.includes(banned),'Pilot unexpectedly uses '+banned);
 }
});
