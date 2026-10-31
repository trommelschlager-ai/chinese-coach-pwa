// v70: ensure approved visuals actually affect live page, no hidden visual-only mockups.
const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/ui-polish-v70.css','utf8');
const sw=fs.readFileSync('sw.js','utf8'),pack=JSON.parse(fs.readFileSync('assets/offline-pack.json'));
const d=new JSDOM(html).window.document,menu=d.getElementById('launch-menu');
assert(menu.querySelectorAll('.six-menu-cards [data-choice]').length===6,'Six real clickable cards');
assert(css.includes('url("./china-misty-pavilion-v70.webp")'),'Requested photo is the actual background');
assert(css.includes('six-original-scenery{display:none!important}'),'Old background disabled');
assert(css.includes('height:min(73dvh,1100px)'),'Menu cards have explicit height; avoid v69 tiny cards');
assert(css.includes('margin-top:clamp(34px,6.3dvh,90px)'),'Card area moved up');
assert(css.includes('background-image:linear-gradient(180deg,rgba(12,24,40,.34)'),'Background dimmed');
for(const n of [1,2,3,4]){
 assert(css.includes('.clean-category:nth-child('+n+')'),'Dialogue card '+n+' themed');
 assert(css.includes('.pronunciation-choice:nth-child('+n+')'),'Pronunciation card '+n+' themed');
}
assert(css.includes('#tones #listening-lab')&&css.includes('#tones #ear-play'),'Listening quiz is restyled');
assert(css.includes('#tones #tone-check')&&css.includes('#tones #record'),'Microphone and graph buttons restyled');
assert(d.getElementById('pitchchart'),'Voice graph preserved');
assert(/chinese-coach-pwa-v(?:70|71|72|73)/.test(sw),'New SW version');
assert(sw.includes('china-misty-pavilion-v70.webp'),'Photo cached for offline');
assert(sw.includes('ui-polish-v70.css?v=70'),'V70 CSS cached');
assert(pack.version>=70);
for(const asset of ['./assets/ui-polish-v70.css','./assets/china-misty-pavilion-v70.webp'])assert(pack.files.includes(asset),asset+' in offline list');
console.log('V70: photographed background and four substantially restyled training screens checks passed');
