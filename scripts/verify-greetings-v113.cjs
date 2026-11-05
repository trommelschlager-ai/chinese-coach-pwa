const fs=require('node:fs'),assert=require('node:assert/strict');
const status=JSON.parse(fs.readFileSync('assets/dialogue-greetings-v113/status.json','utf8'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const engine=fs.readFileSync('assets/learning-quality.js','utf8');
const game=fs.readFileSync('assets/game-practice-v102.js','utf8');
const style=fs.readFileSync('assets/approved-mobile-v112.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const page=fs.readFileSync('game.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.equal(status.ready,true);
assert.equal(status.version,113);
assert.equal(status.count,2);
assert.deepEqual(status.clips.map(c=>[c.text,c.role,c.voice]),[
 ['你好！','female','zh-CN-XiaoxuanNeural'],
 ['哈喽！','male','zh-CN-YunjianNeural']
]);
for(const clip of status.clips){
 const full='assets/dialogue-greetings-v113/'+clip.file;
 const bytes=fs.readFileSync(full);
 assert(bytes.length>=2000,'Missing greeting MP3 '+full);
 assert(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224),'Invalid MP3 '+full);
 assert(pack.files.includes('./'+full),'Missing from offline pack '+full);
}
assert(pack.files.includes('./assets/dialogue-greetings-v113/status.json'));
assert(html.includes("['B','哈喽！','hālou!','Привет! (неформально)']"));
assert(engine.includes("'./assets/dialogue-greetings-v113/l2-'"));
assert(!engine.includes('newGreeting'),'No phone-speech exception for greeting');
assert(engine.includes('window.playDialogueLine')&&engine.includes('window.playStandaloneDialogue'));
assert(game.includes('v115-game')&&game.includes('v115-pinyin')&&game.includes("session.mode==='choose'?'✕ Неверно"),'Approved v115 live game structure and feedback');
assert(style.includes('approved-pastel-v112.webp')&&style.includes('v115-build-panel')&&style.includes('v115-scene-listen'),'Approved scenery and shared game layout are present');
assert(html.includes('approved-mobile-v112.css?v=119')&&page.includes('approved-mobile-v112.css?v=119'));
assert(html.includes('game-practice-v102.js?v=119')&&page.includes('game-practice-v102.js?v=119'));
assert(/const CACHE='chinese-coach-pwa-v\d+-/.test(sw),'Service worker must retain a versioned cache');
console.log('v113 verified: exact female/male greeting MP3s, offline inventory, no phone TTS fallback, compact game layout hooks, page and cache versions.');
