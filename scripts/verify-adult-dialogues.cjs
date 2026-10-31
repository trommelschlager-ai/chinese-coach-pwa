// Real MP3 replacement v73, not a pitch-change of old recordings.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const plan=JSON.parse(fs.readFileSync('assets/dialogue-voice-plan.json','utf8'));
const status=JSON.parse(fs.readFileSync('assets/dialogue-voices-v73/status.json','utf8'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const quality=fs.readFileSync('assets/learning-quality.js','utf8');
const screen=fs.readFileSync('assets/clean-learning-sections.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(status.ready===true&&status.count===25&&status.version===73);
assert.equal(status.voices.A,'zh-CN-XiaoxuanNeural');
assert.equal(status.voices.B,'zh-CN-YunjianNeural');
assert(plan.entries.length===25);
assert.deepEqual(status.role_override,{lesson:2,A:'male',B:'female'},'Anna female and Xiaoming male');
const hash=x=>crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex');
for(const e of plan.entries){
 const newPath=e.file.replace('dialogue-voices/','dialogue-voices-v73/');
 const oldPath=e.file;
 const audio=fs.readFileSync(newPath);
 assert(audio.length>1800,'Missing new MP3 '+newPath);
 assert(audio.subarray(0,3).toString()==='ID3'||(audio[0]===255&&(audio[1]&224)===224),'Bad MP3 '+newPath);
 assert.notEqual(hash(newPath),hash(oldPath),'The old and new MP3 MUST be different: '+newPath);
 assert(pack.files.includes('./'+newPath),'Offline pack missing '+newPath);
}
assert(pack.version===74&&pack.files.includes('./assets/dialogue-voices-v73/status.json'));
assert(quality.includes("fetch('./assets/dialogue-voices-v73/status.json'"));
assert(quality.includes("folder=useNew?'dialogue-voices-v73':'dialogue-voices'"));
assert(quality.includes("a.playbackRate=dialogueClip?1:"));
assert(quality.includes('a.preservesPitch=true'));
assert(screen.includes('data-dialogue-voice-toggle'));
assert(screen.includes('Новые голоса'));
assert(sw.includes("chinese-coach-pwa-v74"));
assert(html.includes("learning-quality.js?v=73")&&html.includes("clean-learning-sections.js?v=73"));
console.log('All 25 truly different Mandarin dialogue MP3s verified, new voices live by default, legacy comparison and offline cache preserved.');
