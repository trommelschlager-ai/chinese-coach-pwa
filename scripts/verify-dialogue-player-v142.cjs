/* Regression coverage for real media-event ordering and offline assets; does not assess audio quality. */
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
// Offline dialogue regression: the status gate and every immutable v73 MP3 must
// be available before the app attempts to play a dialogue without a connection.
const dialoguePlan=JSON.parse(fs.readFileSync('assets/dialogue-voice-plan.json','utf8'));
const offlineSW=fs.readFileSync('sw.js','utf8');
assert(offlineSW.includes('"./assets/dialogue-voices-v73/status.json"'),'Missing offline ready-status needed for dialogue audio');
for(const entry of dialoguePlan.entries){
 const path='./assets/dialogue-voices-v73/'+entry.file.split('/').pop();
 assert(fs.existsSync(path.slice(2)),'Dialogue clip absent: '+path);
 assert(offlineSW.includes(JSON.stringify(path)),'Dialogue clip not pre-cached: '+path);
}
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,clips=[],errors=[];
w.addEventListener('error',e=>errors.push(e.error));
w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).replace('./',''),'utf8'))});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});
w.speechSynthesis={getVoices:()=>[],cancel(){},speak(u){u.onend?.()}};w.SpeechSynthesisUtterance=function(){};
w.Audio=function(src){this.src=src;this.paused=true;clips.push(this);this.play=()=>{this.paused=false;this.onplaying?.();return Promise.resolve()};this.pause=()=>{this.paused=true;this.onpause?.()}};
w.eval([...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n'));
const root=d.getElementById('pg130'),q=s=>root.querySelector(s),click=s=>{const b=q(s);assert(b&&!b.disabled,s);b.click()},tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 w.getDialogueAudioFile=async(id,i)=>`./assets/dialogue-voices-v73/l${id}-${String(i+1).padStart(2,'0')}-${i%2?'b':'a'}.mp3`;
 w.__panda130.show('dialogues');assert.equal(root.querySelectorAll('[data-dialog-line]').length,6);
 const shell=q('.pg-screen'),decoration=q('.pg-sakura');
 click('[data-action=dialog-all]');await tick();assert.equal(q('.pg-speaking').dataset.dialogLine,'0');
 const first=clips.at(-1);assert.equal(first.playbackRate,1);
 click('[data-action=dialog-pause]');assert(first.paused);assert.equal(q('[data-action=dialog-pause]').textContent,'Продолжить');
 click('[data-action=pinyin]');click('[data-action=dialog-translation]');assert.equal(clips.at(-1),first);assert(root.querySelectorAll('.pg-dialog-pinyin[hidden]').length===6);assert.equal(q('.pg-screen'),shell);
 click('[data-action=dialog-pause]');assert(!first.paused);
 first.onended();await tick();assert.equal(q('.pg-speaking').dataset.dialogLine,'1');
 for(let i=1;i<6;i++){assert.equal(q('.pg-speaking').dataset.dialogLine,String(i));assert(fs.existsSync(clips.at(-1).src.replace('./','')));clips.at(-1).onended();await tick()}
 assert(!q('.pg-speaking'));assert(root.textContent.includes('Диалог завершён'));assert.equal(root.querySelectorAll('[data-dialog-line]').length,6);
 click('[data-action=dialog-repeat]');await tick();assert.equal(q('.pg-speaking').dataset.dialogLine,'0');
 const obsolete=clips.at(-1),obsoleteEnd=obsolete.onended;click('[data-action=dialog-tab][data-value="1"]');assert(obsolete.paused);obsoleteEnd();await tick();assert(!q('.pg-speaking'));assert.equal(root.querySelectorAll('[data-dialog-line]').length,5);
 click('[data-action=dialog-line][data-value="3"]');await tick();assert.equal(q('.pg-speaking').dataset.dialogLine,'3');clips.at(-1).onerror();assert(root.textContent.includes('Не удалось воспроизвести'));
 let resolve;w.getDialogueAudioFile=()=>new Promise(r=>resolve=r);click('[data-action=dialog-all]');w.__panda130.show('words');resolve('obsolete.mp3');await tick();assert(!clips.some(a=>a.src==='obsolete.mp3'),'Cancelled loading may not begin after route change');
 const portrait=q('.pg-portrait');click('[data-action=known]');assert.equal(q('.pg-portrait'),portrait,'Decoded approved portrait survives answer updates');assert.equal(q('.pg-screen'),shell);assert.equal(q('.pg-sakura'),decoration);
 w.__panda130.show('settings');assert(root.contains(d.getElementById('app-settings')));assert(d.getElementById('app-settings').open);assert(q('#download-course'));assert(q('#exportprogress'));
 w.__panda130.show('home');assert(!root.contains(d.getElementById('app-settings')));w.__panda130.show('settings');assert(q('#exportprogress'),'Original backup controls survive repeat navigation');
 w.__panda130.show('course');assert(root.hidden,'Legacy course must not be covered by a reopened Panda home');w.getDialogueAudioFile=async(id,i)=>`./assets/dialogue-voices-v73/l${id}-${String(i+1).padStart(2,'0')}-${i%2?'b':'a'}.mp3`;w.eval('openCourseLesson(2,2)');const legacy=d.querySelector('#lesson-panel .pg-dialogue-player');assert(legacy,'Course uses the shared chat player');assert.equal(legacy.querySelectorAll('[data-dialog-line]').length,6);legacy.querySelector('[data-action=dialog-all]').click();await tick();assert(legacy.querySelector('.pg-speaking'));legacy.querySelector('[data-action=dialog-pause]').click();assert(clips.at(-1).paused);d.querySelector('#course-next').click();assert(d.querySelector('#lesson-panel .course-options'),'Full transcript advances directly to the quiz');assert(clips.at(-1).paused,'Leaving the lesson cancels playback');
 await tick();assert.equal(errors.length,0);console.log('v142: full transcripts, media-event sync, pause/resume, repeat, per-line playback, stale-load cancellation, missing-MP3 error, in-place toggles, stable images, reachable settings and preserved backup controls passed.');
 w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
