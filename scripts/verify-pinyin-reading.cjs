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
const actual=curriculum.groups.filter(g=>!['A','E','I','O','U','Ü','W','Y'].includes(g.letter)).flatMap(g=>g.items.map(item=>item.unit));
assert.deepEqual(actual.sort(),initials.sort(),'21 initials and separate y/w spelling aids');
assert.equal(curriculum.clips.length,91,'91 audio files are planned');
assert.equal(new Set(curriculum.clips.map(c=>c.id)).size,91);
assert(curriculum.groups.some(g=>g.items.some(x=>x.py==='pāi')));
assert(curriculum.rules.some(r=>r.title.includes('iou → iu')));
assert(curriculum.rules.some(r=>r.title.includes('uei → ui')));
assert(curriculum.rules.some(r=>r.title.includes('uen → un')));
assert(curriculum.rules.some(r=>r.title.includes('ü')));
assert(curriculum.rules.some(r=>r.title.includes('нейтральный')));
assert(curriculum.rules.some(r=>r.title.includes('Апостроф')));
assert(html.includes('Звуки, звукосочетания и тоны'),'Main menu label preserves user request');
assert(js.includes('data-reference-mode="rules"')&&js.includes('data-pinyin-letter'),'Alphabet and rule controls are present');
assert(html.includes('pinyin-combinations.css?v=64'),'Updated Pinyin CSS linked');
assert(html.includes('pronunciation-hub.js?v=64'),'Updated Pinyin JS linked');
assert.equal(pack.version,64,'PWA offline pack updated');
for(const clip of curriculum.clips){
 const path=clip.file;
 assert(fs.statSync(path).size>1500,'Missing generated MP3: '+path);
 assert(pack.files.includes('./'+path),'Offline download missing clip: '+path);
}
const status=JSON.parse(fs.readFileSync('assets/pinyin-reading/status.json','utf8'));
assert.equal(status.ready,true);
assert.equal(status.count,curriculum.clips.length);
console.log('Pinyin checks passed: 26 A-Z units, 36 finals, 21 initials, 21 rules and 91 local MP3 recordings.');
