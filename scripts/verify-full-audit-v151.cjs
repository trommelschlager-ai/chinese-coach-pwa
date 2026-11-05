/* Runtime inventory. This checks paths/events, not the audible Mandarin or Android. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,clips=[],errors=[];
w.addEventListener('error',e=>errors.push(String(e.error)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});
w.fetch=async()=>{throw Error('offline: no status manifest')};w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){throw Error('Unrequested TTS')}};
w.Audio=function(src){this.src=src;this.pause=()=>this.onpause?.();this.play=()=>{clips.push(this);this.onplaying?.();return Promise.resolve()}};
w.eval([...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n'));
const r=d.querySelector('#pg130'),click=s=>{const b=r.querySelector(s);assert(b&&!b.disabled,s);b.click()},tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const dialogues=[];
 for(const [lesson,count] of [[1,4],[2,6],[3,5],[4,4],[5,6]])for(let i=0;i<count;i++){
  const file=await w.getDialogueAudioFile(lesson,i);assert(file.includes('dialogue-voices-v73/'));assert(fs.existsSync(file.slice(2)));dialogues.push({lesson,line:i+1,file,statusUnavailable:true});
 }
 // An unavailable manifest cannot mute individual example clips either.
 const pending=w.playDialogueLine(3,1);await tick();assert(clips.at(-1).src.includes('dialogue-voices-v73/l3-02-b.mp3'));clips.at(-1).onended();await pending;
 const cards=[];w.__panda130.show('words');
 for(let i=0;i<193;i++){
  const hz=r.querySelector('.pg-hanzi').textContent,py=r.querySelector('.pg-word-copy .pg-pinyin').textContent,ru=r.querySelector('.pg-meaning').textContent;
  const image=r.querySelector('.pg-portrait').getAttribute('src');assert(fs.existsSync(image.slice(2)));assert.equal(r.querySelector('.pg-portrait').alt,'Иллюстрация к слову '+hz);
  click('[data-action=word-play]');await tick();assert(clips.at(-1));const wordFile=clips.at(-1).src;assert(fs.existsSync(decodeURIComponent(wordFile).slice(2)));
  const examples=[...r.querySelectorAll('.pg-example')].map(e=>({text:e.querySelector('strong').textContent,label:e.querySelector('button').getAttribute('aria-label'),kind:e.querySelector('.pg-audio-kind').textContent}));
  for(let n=0;n<examples.length;n++){click(`[data-action=example][data-value="${n}"]`);await tick();await tick();const clip=clips.at(-1);assert(fs.existsSync(decodeURIComponent(clip.src).slice(2)));examples[n].firstFile=clip.src;clip.onended?.();}
  if(hz==='家')assert(examples.every(e=>!e.text.includes('大家')));
  if(hz==='朋友')assert(image.includes('meaning-friends'));
  cards.push({hz,py,ru,image,wordFile,examples,imageReview:image.includes('word-girl')?'UNRESOLVED: generic 113x127 portrait':'Existing semantic artwork; some symbols remain approximate'});
  click('[data-action=word-go]');
 }
 assert.equal(new Set(cards.map(x=>x.hz)).size,193);assert.equal(errors.length,0,errors.join('\n'));
 // Real player must handle a media failure and allow retry from the same control.
 w.__panda130.show('dialogues');click('[data-action=dialog-line][data-value="2"]');await tick();assert(r.querySelector('[aria-current=true]'));clips.at(-1).onerror();assert(r.textContent.includes('Не удалось воспроизвести'));
 click('[data-action=dialog-repeat]');await tick();assert.equal(r.querySelector('[aria-current=true]').dataset.dialogLine,'0');
 const report={baseline:'3d614ec5da15fae949e4e683ca2d1d08b3d02292',cards,dialogues,semanticImages:cards.filter(x=>!x.image.includes('word-girl')).length,genericImages:cards.filter(x=>x.image.includes('word-girl')).length,limits:['Mock media only: audible text, tone quality and Android playback are not verified','No viewport emulation in this script']};
 fs.mkdirSync('qa/v151',{recursive:true});fs.writeFileSync('qa/v151/runtime-inventory.json',JSON.stringify(report,null,2));console.log(`v151: ${cards.length} word paths; ${dialogues.length} v73 paths without status manifest; ${report.semanticImages} semantic images / ${report.genericImages} unresolved; media-error retry passed.`);w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
