// V71 regression: the four illustrated dialogue cards keep live clickable text,
 // the requested photograph is included in the offline cache and adult dialogue MP3s exist.
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/ui-polish-v71.css','utf8');
const script=fs.readFileSync('scripts/generate_dialogue_mp3.py','utf8');
const sw=fs.readFileSync('sw.js','utf8'),status=JSON.parse(fs.readFileSync('assets/dialogue-voices/status.json'));
const files=JSON.parse(fs.readFileSync('assets/offline-pack.json'));
const d=new JSDOM(html).window.document;
assert.equal(d.querySelectorAll('#launch-menu .six-menu-cards [data-choice]').length,6);
assert(css.includes('china-autumn-pagoda-v71.webp'),'Use user-selected autumn pagoda');
assert(fs.statSync('assets/china-autumn-pagoda-v71.webp').size>2000);
assert(css.includes('#topics[data-simple-section="dialogues"] .clean-category:nth-child(4)'),'Four themes present');
for(const word of ['#f5b1d4','#f5cca1','#aed1f8','#a5e7d3'])assert(css.includes(word));
assert(fs.readFileSync('assets/clean-learning-sections.js','utf8').includes('clean-dialog-hanzi'),'Chinese badge restored');
assert(status.ready&&status.count===25);
assert.equal(status.voices.A,'zh-CN-XiaoruiNeural');
assert.equal(status.voices.B,'zh-CN-YunyangNeural');
assert(script.includes('must_regenerate'),'Generator forces fresh MP3s when voice pair changes');
for(const entry of JSON.parse(fs.readFileSync('assets/dialogue-voice-plan.json','utf8')).entries){
 let data=fs.readFileSync(entry.file);
 assert(data.length>1800,entry.file);
 assert(data.subarray(0,3).toString()==='ID3'||(data[0]===255&&(data[1]&224)===224),entry.file);
 assert(files.files.includes('./'+entry.file),entry.file+' must be packaged');
}
assert(files.version===71&&sw.includes('chinese-coach-pwa-v71'));
for(const p of ['./assets/ui-polish-v71.css','./assets/china-autumn-pagoda-v71.webp'])assert(files.files.includes(p));
console.log('V71: picture backdrop, illustrated dialogue cards, 25 verified adult-voice MP3s and offline assets.');
