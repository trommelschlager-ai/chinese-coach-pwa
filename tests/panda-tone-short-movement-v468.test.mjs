import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyseContour,shortPitchMovement} from '../assets/panda-tone-analytics-v457.mjs';

const short = fn => Array.from({length:22},(_,i)=>({
 t:Math.round(i*16)/1000,hz:fn(i/21),clarity:.95
}));

test('four ordinary ~0.34s syllables show cautious pitch movement, not a Mandarin grade',()=>{
 const cases=[
  ['level',u=>190],
  ['rise',u=>150+78*u],
  ['dip',u=>u<=.5?215-155*u:137.5+155*(u-.5)],
  ['fall',u=>255-95*u]
 ];
 for(const [expected,frequency] of cases){
  const result=analyseContour(short(frequency));
  assert.equal(result.kind,'insufficient','Short natural duration should not be a certified tone');
  assert.equal(result.isToneGrade,false);
  assert.equal(result.points.length,22);
  assert.equal(result.shapeHint?.direction,expected,
    expected+' sound produced '+JSON.stringify(result.shapeHint));
  assert.equal(result.shapeHint?.isToneGrade,false);
  assert.equal(result.shapeHint?.confidence,'exploratory');
  assert(result.shapeHint.durationSec<.5);
 }
});

test('four real lesson-MP3 F0 tracks describe movement without assigning tones',()=>{
 // Timestamped decoded F0 from original lesson MP3s in the CI reference report.
 // This is a technical regression set, NOT human verification of pronunciation.
 const cases=[
  ['mā','level',[260.9,268.6,278.5,300,304.5,307.8,310.1,311.6,313.5,314.9,315.9,317.1,318.1,319.2,320.5,321.6,322.4,323,323.4,323.3,324.3,315.8]],
  ['má','rise',[214.3,214.7,215.4,216.7,214.4,212.3,210.6,209.4,208.4,207.8,207.8,208.8,210.6,212.3,218.2,222.2,235.3,260.9,266.7,279.1,290.2,293.9,300]],
  ['mǎ','dip',[224.3,219.7,220,219.9,216.2,213.6,211.2,209.1,206.4,204.3,202.4,201.8,202.1,202.9,204.9,207.7,210.9,214.5,218.9,222.2,225.1,229.5,231.4]],
  ['mà','fall',[281.7,292.7,299.2,327,331,333.7,334.8,335.3,336.1,335.9,334.2,331.2,326.7,322.3,315.8,307.7,307.7,292.7,230.8,230.8,228.9,221.5,220.6,222.2]]
 ];
 for(const [pinyin,direction,hz] of cases){
  const f=hz.map((v,i)=>({t:(i+2+(pinyin==='mà'&&i>=18?1:0))*.016,hz:v,clarity:.9}));
  const result=analyseContour(f);
  assert.equal(result.kind,'insufficient',pinyin+' must remain ungraded');
  assert.equal(result.isToneGrade,false);
  assert.equal(result.shapeHint?.direction,direction,
    pinyin+': '+JSON.stringify(result.shapeHint));
  assert.equal(result.shapeHint?.isToneGrade,false);
 }
});

test('short speech with too few frames, gaps, or an octave slip cannot receive movement hints',()=>{
 const ten=short(u=>175+40*u).slice(0,10);
 assert.equal(analyseContour(ten).kind,'insufficient');
 assert.equal(analyseContour(ten).shapeHint,null);
 const gap=short(u=>170+45*u);
 gap[12].t+=.12;
 assert.equal(shortPitchMovement(gap),null);
 const octave=short(u=>140+30*u);
 octave[10].hz*=2;
 const result=analyseContour(octave);
 assert.equal(result.kind,'insufficient');
 assert.equal(result.isToneGrade,false);
 assert.equal(result.shapeHint,null);
 assert.equal(result.points.length,0);
});

test('the short-syllable UI does not equate observed pitch direction with pronunciation correctness',()=>{
 const page=fs.readFileSync(new URL('../panda-tone-ma-practice.html',import.meta.url),'utf8');
 const script=fs.readFileSync(new URL('../assets/panda-tone-ma-pilot-v463.mjs',import.meta.url),'utf8');
 const helper=fs.readFileSync(new URL('../assets/panda-tone-analytics-v457.mjs',import.meta.url),'utf8');
 assert(!helper.includes('0,7–1,2'), 'Outdated forced duration remains in helper');
 assert(!script.includes('около секунды'), 'Learner should not be told to elongate ma');
 assert(page.includes('Нет оценок'));
 assert(page.includes('v=468'));
 assert(script.includes('result.shapeHint'));
 assert(script.includes('referenceForTone(selected,sound?.syllableDurationSec)'));
 assert(script.includes('PLOT_SECONDS=1.2'));
 assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon/i.test(script));
});

test('tone reference diagram uses the same observed short duration, not whole width',()=>{
 const s=fs.readFileSync(new URL('../assets/panda-tone-ma-pilot-v463.mjs',import.meta.url),'utf8');
 const a=s.indexOf('function referenceForTone('),b=s.indexOf('function toneGuidance');
 assert(a>=0&&b>a);
 const source=s.slice(a,b);
 const f=new Function(source+'\nreturn referenceForTone;')();
 const endX=(path)=>Number(path.match(/(?:H| )([0-9]+(?:\.[0-9]+)?)$/)?.[1]);
 const flat=f(0,.3),full=f(0,1.2);
 assert(endX(flat)>90&&endX(flat)<120,flat);
 assert(endX(full)>330,full);
 assert(f(1,.3).startsWith('M30 101'));
 assert(f(2,.3).includes('Q'));
 assert(f(3,.3).startsWith('M30 44'));
});
