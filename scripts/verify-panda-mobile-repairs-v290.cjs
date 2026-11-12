'use strict';
/* Regressions observed on Android on 12 Nov 2026, verified against live lesson assets. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const l2=read('assets/hsk1-second-v203.js');
const l5=read('assets/hsk1-fifth-v227.js');
const l67=read('assets/panda-go-companion-v231.js');
const visual=read('assets/lesson-visuals-v233.js');
for(const [p,src] of [['L2',l2],['L5',l5],['L67',l67]])new vm.Script(src,{filename:p});
assert(l2.includes('data-repeat-step')&&l2.includes('replayDrill'));
assert(!l2.includes('if(step!==11&&AUTO_ADVANCE_DRILLS.has(step)&&state.done[step]){state.step++'),'No automatic leap after L2 recognition');
assert(!l2.includes('if(state.index[step]===builds[step].length){state.done[step]=true;if(AUTO_ADVANCE_DRILLS.has(step))'),'No automatic leap after L2 builder');
assert(l5.includes('data-repeat-listen')&&l5.includes('data-repeat-builder'),'L5 listening and builder must repeat');
assert(/listenReady=true;\s*app\.querySelectorAll\('\[data-listen\]'\)\.forEach\(el=>el\.disabled=false\)/.test(l5),'L5 answers should unlock on play tap');
assert(l67.includes('data-repeat-listen')&&l67.includes('data-repeat-builder'),'L6 and L7 allow replay');
assert(/listenReady=true;\s*stage\.querySelectorAll\('\[data-listen\]'\)\.forEach\(el=>el\.disabled=false\)/.test(l67),'L6 and L7 unlock after tapping Listen');
assert(visual.includes("lesson===7&&Object.prototype.hasOwnProperty.call(weatherIcon,word)"),'Replace stale weather sprites');
assert(visual.includes("if(lesson!==7&&step>0"),'No old coach scene in Lesson 7');
const mic=read('assets/panda-mic-v236.js');
assert(mic.includes('2*Math.PI*85')&&mic.includes('Math.min(1.35,'),'Gently remove rumble while capping gain');
const audio=fs.readFileSync('assets/lesson5-male-clean-v290.mp3');
assert(audio.length>8000,'No cleaned male speech present');
assert.equal(audio.subarray(0,3).toString('ascii'),'ID3','Invalid MP3 header');
assert(l5.includes("hz==='今天几月几号？'?'./assets/lesson5-male-clean-v290.mp3'"),'Noisy phrase should use new recording');
for(const [html,token] of [
 ['hsk1-second-v203.html','hsk1-second-v203.js?v=294'],
 ['hsk1-fifth-v227.html','hsk1-fifth-v227.js?v=292'],
 ['hsk1-family-v231.html','panda-go-companion-v231.js?v=292'],
 ['hsk1-weather-v231.html','panda-go-companion-v231.js?v=292']
])assert(read(html).includes(token),html+' has outdated cached script');
const pack=JSON.parse(read('assets/offline-pack.json'));
assert(pack.version>=290&&pack.files.includes('./assets/lesson5-male-clean-v290.mp3'));
const cache=read('sw.js').match(/^const CACHE='chinese-coach-pwa-v(\d+)-/);assert(cache&&Number(cache[1])>=290,'Service worker must refresh to a current release');
console.log('PASS Panda Go v290: replayable exercises, audio answer gating, weather art, mic safeguards and repaired male voice.');
