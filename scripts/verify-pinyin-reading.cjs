// Extra regression checks for the alphabetic Pinyin reading reference.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const curriculum=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('assets/pronunciation-hub.js','utf8');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert.equal(curriculum.groups.length,26,'A-Z includes Ü as an extra learning unit');
assert.equal(curriculum.rules.length,21,'All 21 reading rules are taught');
const finals=['a','ai','an','ang','ao','e','ei','en','eng','er','i','ia','ian','iang','iao','ie','in','ing','iong','iu','o','ong','ou','u','ua','uai','uan','uang','ueng','ui','un','uo','ü','üe','üan','ün'];
assert.equal(finals.length,36);
const mappedFinals=curriculum.groups.filter(g=>['A','E','I','O','U','Ü'].includes(g.letter)).flatMap(g=>g.items.map(item=>item.unit));
assert.deepEqual([...new Set(mappedFinals)].sort(),finals.sort(),'All 36 finals are present');
const initials=['b','c','ch','d','f','g','h','j','k','l','m','n','p','q','r','s','sh','t','x','z','zh'];
const actual=[...new Set(curriculum.groups.filter(g=>!['A','E','I','O','U','Ü','W','Y'].includes(g.letter)).flatMap(g=>g.items.map(item=>item.unit)))];
assert.deepEqual(actual.sort(),initials.sort(),'21 initials and separate y/w spelling aids');
assert.equal(curriculum.clips.length,190,'190 unique Pinyin example audio files planned');
assert.equal(new Set(curriculum.clips.map(c=>c.id)).size,190);
assert(curriculum.groups.some(g=>g.items.some(x=>x.py==='pāi')));
assert(curriculum.groups.every(g=>g.items.length>=6),'Every letter offers at least six reading examples');
assert.equal(curriculum.groups.reduce((n,g)=>n+g.items.length,0),198,'Expanded example coverage');
assert(curriculum.guidance.o.includes('коротким переходом через u'),'O after b/p/m/f must be explained accurately');
assert(js.includes('data-pinyin-rate="0.85" aria-pressed="true"'),'Natural 0.85x is now the default');
assert(js.includes('data-pinyin-rate="0.75" aria-pressed="false"'),'Extra slow mode remains available');
assert(js.includes('a.playbackRate=readingRate'),'Audio actually uses playback speed');
assert(js.includes('./assets/pinyin-reading-v5/'),'Pinyin MP3s must use the new softer voice folder');
assert(curriculum.rules.some(r=>r.title.includes('iou → iu')));
assert(curriculum.rules.some(r=>r.title.includes('uei → ui')));
assert(curriculum.rules.some(r=>r.title.includes('uen → un')));
assert(curriculum.rules.some(r=>r.title.includes('ü')));
assert(curriculum.rules.some(r=>r.title.includes('нейтральный')));
assert(curriculum.rules.some(r=>r.title.includes('Апостроф')));
assert(html.includes('Звуки, звукосочетания и тоны'),'Main menu label preserves user request');
assert(js.includes('data-reference-mode="rules"')&&js.includes('data-pinyin-letter'),'Alphabet and rule controls are present');
assert(html.includes('pinyin-combinations.css?v=65'),'Updated Pinyin CSS linked');
assert(html.includes('pronunciation-hub.js?v=75'),'Updated Pinyin JS linked');
assert(pack.version>=65,'PWA offline pack includes pronunciation assets');
for(const clip of curriculum.clips){
 const path=clip.file;
 assert(fs.statSync(path).size>1500,'Missing generated MP3: '+path);
 assert(pack.files.includes('./'+path),'Offline download missing clip: '+path);
}
const status=JSON.parse(fs.readFileSync('assets/pinyin-reading-v5/status.json','utf8'));
assert.equal(status.ready,true);
assert.equal(status.count,curriculum.clips.length);
assert.equal(status.voice,'zh-CN-YunyangNeural','Professional Mandarin narrator must replace childlike voice');
const crypto=require('node:crypto'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const clip of curriculum.clips){
 const newFile=clip.file.replace('pinyin-reading-v2/','pinyin-reading-v5/');
 assert(fs.statSync(newFile).size>1500,'No new MP3 '+newFile);
 assert(pack.files.includes('./'+newFile),'Offline pack missing '+newFile);
 assert.notEqual(hash(clip.file),hash(newFile),'Old voice not replaced for '+clip.id);
}
assert(js.includes('"zh-CN-YunyangNeural"'),'New professional narrator must be active');
console.log('Pinyin checks passed: 26 groups, 36 finals, 21 initials, 21 rules, 190 fresh Yunyang MP3s.');
