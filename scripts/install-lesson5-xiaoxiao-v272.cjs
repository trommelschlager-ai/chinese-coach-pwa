'use strict';
/* Install uploaded voice assets without changing existing screens or progress. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='assets/lesson5-xiaoxiao-v272';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
assert.equal(manifest.version,272);
assert.equal(manifest.clips.length,17,'Exactly 17 new recorded phrases expected');
assert(fs.existsSync('assets/lesson5-xiaoxiao-v272.js'));
function patch(file,oldText,newText){
 const text=fs.readFileSync(file,'utf8');
 if(text.includes(newText))return;
 assert(text.includes(oldText),'Unrecognized original '+file);
 fs.writeFileSync(file,text.replace(oldText,newText));
}
const jsFile='assets/hsk1-fifth-v227.js';
let js=fs.readFileSync(jsFile,'utf8');
const start=js.indexOf("function voice(hz,role='female'){");
const stop=js.indexOf('\nfunction play(hz,role=',start);
assert(start>=0&&stop>start,'Lesson 5 voice function not found');
const newVoice=`function voice(hz,role='female'){
 // Male lines in the date dialogue must never be silently replaced by the female narrator.
 if(role==='male')return window.PANDA_HSK1_VOICES?.male?.[hz]||null;
 const xiaoxiao=window.PandaLesson5XiaoxiaoV272?.lookup(hz);
 if(xiaoxiao)return xiaoxiao;
 // Only for future new words without a Xiaoxiao clip: retain the existing recorded fallback.
 return window.PandaCleanAudioV249?.lookup(hz)||
  window.PandaNativeRecoveredV246?.lookup(hz)||
  window.PandaOwnerAudio?.lookup(hz)||
  window.PANDA_HSK1_VOICES?.female?.[hz]||null;
}`;
if(!js.includes('window.PandaLesson5XiaoxiaoV272?.lookup(hz)')){
 js=js.slice(0,start)+newVoice+js.slice(stop);
 fs.writeFileSync(jsFile,js);
}
const page='hsk1-fifth-v227.html';
const originalTag='<script src="./assets/hsk1-fifth-v227.js?v=249"></script>';
const replacement='<script src="./assets/lesson4-xiaoxiao-v265.js?v=265"></script>\n<script src="./assets/lesson5-xiaoxiao-v272.js?v=272"></script>\n<script src="./assets/hsk1-fifth-v227.js?v=272"></script>';
patch(page,originalTag,replacement);
patch('scripts/verify-hsk1-fifth-v227.cjs',
 "assert(html.includes('hsk1-fifth-v227.js?v=249'));",
 "assert(html.includes('hsk1-fifth-v227.js?v=272'));");
const packFile='assets/offline-pack.json';
let pack=JSON.parse(fs.readFileSync(packFile,'utf8'));
pack.version=Math.max(pack.version||0,272);
const paths=[
 './assets/lesson4-xiaoxiao-v265.js?v=265',
 './assets/lesson5-xiaoxiao-v272.js?v=272',
 './assets/hsk1-fifth-v227.js?v=272',
 './hsk1-fifth-v227.html?v=272',
 ...manifest.clips.map(x=>'./'+root+'/'+x.file),
 ...Object.values(manifest.sharedFromLesson4)
];
for(const path of paths)if(!pack.files.includes(path))pack.files.push(path);
fs.writeFileSync(packFile,JSON.stringify(pack,null,2)+'\n');
const swFile='sw.js';
const sw=fs.readFileSync(swFile,'utf8');
fs.writeFileSync(swFile,sw.replace(/^const CACHE='[^']+';/,"const CACHE='chinese-coach-pwa-v272-lesson5-xiaoxiao';"));
console.log('PASS install Panda Go lesson 5 v272, 17 native MP3, 3 shared Xiaoxiao recordings, 2 male lines');
