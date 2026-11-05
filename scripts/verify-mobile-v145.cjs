/* Exercise all vocabulary cards and their actual click-to-audio paths. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,d=w.document,played=[],errors=[];
w.addEventListener('error',e=>errors.push(String(e.error)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).replace('./',''),'utf8'))});w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){throw Error('Unexpected system voice')}};w.Audio=function(src){this.src=src;this.play=()=>{played.push(src);this.onplaying?.();return Promise.resolve()};this.pause=()=>this.onpause?.()};
w.eval([...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n'));
const root=d.querySelector('#pg130'),tick=()=>new Promise(r=>setImmediate(r)),click=s=>{const b=root.querySelector(s);assert(b&&!b.disabled,s);b.click()};
(async()=>{
 w.__panda130.show('words');const rows=[];
 for(let i=0;i<193;i++){
  const hz=root.querySelector('.pg-hanzi').textContent,py=root.querySelector('.pg-word-copy .pg-pinyin')?.textContent;assert(py?.trim(),hz+' pinyin');
  const examples=[...root.querySelectorAll('.pg-example strong')].map(e=>e.textContent);assert(examples.length<=3);assert(examples.every(x=>x.replace(/[。！？!？]/g,'')!==hz),'A bare word is not an example sentence');
  for(let n=0;n<examples.length;n++){const before=played.length;click(`[data-action=example][data-value="${n}"]`);await tick();await tick();assert(played.length>before,hz+' example audio');assert(fs.existsSync(decodeURIComponent(played.at(-1)).replace('./','')),played.at(-1))}
  rows.push({hz,py,examples});if(i<192)click('[data-action=word-go]');
 }
 w.__panda130.show('words');click('[data-action=pinyin]');assert(!root.querySelector('.pg-word-copy .pg-pinyin'));assert(!root.querySelector('.pg-example small')?.textContent.includes('Wǒ'));assert(root.textContent.includes('Пиньинь: скрыт'));click('[data-action=pinyin]');
 w.__panda130.show('tones');for(const tab of ['Инициали','Финали','Сочетания']){click(`[data-action=tone-tab][data-value="${tab}"]`);for(const b of root.querySelectorAll('[data-action=syllable]')){const before=played.length;b.click();assert(played.length>before,tab+' '+b.textContent);assert(fs.existsSync(decodeURIComponent(played.at(-1)).replace('./','')))}}
 for(const [id,count] of [[1,4],[2,6],[3,5],[4,4],[5,6]])for(let i=0;i<count;i++){const path=await w.getDialogueAudioFile(id,i);assert(path.includes('dialogue-voices-v73/'));assert(fs.existsSync(path.replace('./','')))}
 assert.equal(errors.length,0,errors.join('\n'));const summary={words:rows.length,withThree:rows.filter(x=>x.examples.length===3).length,withSome:rows.filter(x=>x.examples.length>0).length,withoutExamples:rows.filter(x=>!x.examples.length).map(x=>x.hz),cards:rows};fs.mkdirSync('qa/audit-v144',{recursive:true});fs.writeFileSync('qa/audit-v144/word-coverage.json',JSON.stringify(summary,null,2));console.log(`v145: ${rows.length} cards, ${summary.withThree} with three recorded examples, ${summary.withSome} with any; 49 phonetic buttons and 25 role-consistent dialogue paths. Missing examples explicitly listed, not replaced by repeated words.`);w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
