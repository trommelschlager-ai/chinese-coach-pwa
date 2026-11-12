'use strict';
/* Install user-provided Xiaoxiao clips in the active 14-screen family lesson. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const directory='assets/lesson6-xiaoxiao-v274';
const manifest=JSON.parse(fs.readFileSync(directory+'/manifest.json','utf8'));
assert.equal(manifest.version,274);
assert.equal(manifest.clips.length,17);
assert(fs.existsSync('assets/lesson6-xiaoxiao-v274.js'));
function patch(path,oldText,newText){
 let s=fs.readFileSync(path,'utf8');
 if(s.includes(newText))return;
 assert(s.includes(oldText),'Unexpected source file: '+path+'; expected '+oldText.slice(0,90));
 fs.writeFileSync(path,s.replace(oldText,newText));
}
const companion='assets/panda-go-companion-v231.js';
let code=fs.readFileSync(companion,'utf8');
if(!code.includes('PandaLesson6XiaoxiaoV274?.lookup(hz)')){
 const find=" if(!isFamily)return weatherClips(hz)[0]||null;\n";
 assert(code.includes(find),'Family voice resolver changed');
 const inject=find+
  " // Preserve the original male actor: never substitute Xiaoxiao for male role A.\n"+
  " if(role==='male'){const bare=String(hz).replace(/[。！？!?]\\s*$/,'');return mappings.male?.[hz]||mappings.male?.[bare]||null;}\n"+
  " const newlyRecorded=window.PandaLesson6XiaoxiaoV274?.lookup(hz);\n"+
  " if(newlyRecorded)return newlyRecorded;\n";
 code=code.replace(find,inject);
 const oldParts=" const parts=isFamily?(familyOriginalParts(hz,role)||[src]):weatherClips(hz);";
 const newParts=" const lesson6New=isFamily&&role!=='male'&&!!window.PandaLesson6XiaoxiaoV274?.lookup(hz);\n const parts=isFamily?(lesson6New?[src]:(familyOriginalParts(hz,role)||[src])):weatherClips(hz);";
 assert(code.includes(oldParts),'Family sound sequencer changed');
 code=code.replace(oldParts,newParts);
 fs.writeFileSync(companion,code);
}
patch('hsk1-family-v231.html',
  '<script src="./assets/panda-go-companion-v231.js?v=244"></script>',
  '<script src="./assets/lesson6-xiaoxiao-v274.js?v=274"></script>\n<script src="./assets/panda-go-companion-v231.js?v=274"></script>');
patch('scripts/verify-panda-go-approved-v231.cjs',
  "lesson===7?'249':'244'",
  "lesson===7?'249':'274'");
patch('scripts/verify-panda-audio-v244.cjs',
  "f.includes('weather')?'249':'244'",
  "f.includes('weather')?'249':'274'");
const packfile='assets/offline-pack.json';
const offline=JSON.parse(fs.readFileSync(packfile,'utf8'));
offline.version=Math.max(274,offline.version||0);
const nextFiles=[
 './assets/lesson6-xiaoxiao-v274.js?v=274',
 './assets/panda-go-companion-v231.js?v=274',
 './hsk1-family-v231.html?v=274',
 ...manifest.clips.map(x=>'./'+directory+'/'+x.file),
 ...Object.values(manifest.sharedTones)
];
for(const filename of nextFiles)if(!offline.files.includes(filename))offline.files.push(filename);
fs.writeFileSync(packfile,JSON.stringify(offline,null,2)+'\n');
const swFile='sw.js';
let sw=fs.readFileSync(swFile,'utf8');
sw=sw.replace(/^const CACHE='[^']+';/,"const CACHE='chinese-coach-pwa-v274-lesson6-xiaoxiao';");
fs.writeFileSync(swFile,sw);
const workflow='.github/workflows/course-qa.yml';
patch(workflow,
 '      - run: node scripts/verify-hsk1-lesson5-xiaoxiao-v272.cjs',
 '      - run: node scripts/verify-hsk1-lesson5-xiaoxiao-v272.cjs\n      - run: node scripts/verify-hsk1-lesson6-xiaoxiao-v274.cjs');
console.log('Installed lesson 6 v274: 17 new Xiaoxiao recordings, 4 reused tone samples, male role preserved.');
