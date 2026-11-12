'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const base='assets/lesson6-xiaoxiao-v274';
const manifest=JSON.parse(fs.readFileSync(base+'/manifest.json','utf8'));
const expected=['妈妈','爸爸','哥哥','姐姐','弟弟','妹妹','家','我的','有','没有','一个',
'我有一个妹妹。','我的妈妈。','我没有哥哥。','这是我爸爸。','是，这是我妈妈。','有，我有一个妹妹。'];
assert.equal(manifest.clips.length,expected.length);
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/lesson6-xiaoxiao-v274.js','utf8'),sandbox);
const map=sandbox.window.PandaLesson6XiaoxiaoV274;assert(map);
for(let i=0;i<expected.length;i++){
 const r=manifest.clips[i],p=base+'/'+r.file,b=fs.readFileSync(p);
 assert.equal(r.index,i);
 assert.equal(r.hanzi,expected[i]);
 assert(b.length>4500,'Empty or too short '+expected[i]);
 assert.equal(b.length,r.bytes);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.sha256);
 assert.equal(map.lookup(expected[i]),'./'+p);
}
for(const [word,file] of Object.entries(manifest.sharedTones)){
 assert.equal(map.lookup(word),file);
 assert(fs.existsSync(file.replace(/^\.\//,'')),'Reused tone recording absent '+word);
}
assert.equal(map.lookup('是，这是我妈妈'),map.lookup('是，这是我妈妈。'),'Sentence punctuation must be normalized');
const code=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const html=fs.readFileSync('hsk1-family-v231.html','utf8');
assert(html.includes('lesson6-xiaoxiao-v274.js?v=274')&&html.includes('panda-go-companion-v231.js?v=274'));
assert(html.indexOf('lesson6-xiaoxiao-v274.js?v=274')<html.indexOf('panda-go-companion-v231.js?v=274'));
assert(code.includes('window.PandaLesson6XiaoxiaoV274?.lookup(hz)'));
assert(code.includes("if(role==='male')")&&code.includes("mappings.male?.[hz]"),'Keep male actor');
assert(code.includes('lesson6New?[src]:(familyOriginalParts(hz,role)||[src])'),'Avoid old stitched audio over new whole sentence');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(pack.version>=274);
for(const hz of expected)assert(pack.files.includes(map.lookup(hz)),'Offline sound missing '+hz);
const oldMale=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
for(const text of manifest.maleDialogue)assert(oldMale.includes('"'+text+'"'),'Male line missing '+text);
console.log('PASS lesson 6 v274: 17 full recordings + 4 existing tone samples, dialogue roles, caching and active page');
