const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=>'';
w.speechSynthesis={getVoices:()=>[{lang:'zh-CN',voiceURI:'local',localService:true}],cancel(){},speak(u){u.onend?.()}};w.SpeechSynthesisUtterance=function(text){this.text=text};
w.Audio=function(){this.play=()=>{this.onended?.();return Promise.resolve()};this.pause=()=>this.onpause?.()};
const code=[...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n').replace("'use strict';",'');
w.eval(code);

(async()=>{
 let exported;
 w.URL.createObjectURL=b=>{exported=b;return 'blob:test'};
 w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 const game={completed:8,points:270,streak:3,lastDay:'2026-11-01',best:{build:9,choose:9,listen:9}};
 w.courseProgress.writeGame(game);
 const review={'我':{level:2,due:Date.now()+86400000}};
 w.localStorage.setItem('chinese-coach-basic-review-v98',JSON.stringify(review));
 w.localStorage.setItem('chinese-coach-daily-v98',JSON.stringify({day:'2026-11-01',step:2,paused:true}));
 d.getElementById('exportprogress').click();
 const text=await new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(exported)});
 const data=JSON.parse(text);assert.equal(data.version,4);assert.deepEqual(data.game,game);assert.deepEqual(data.basicReview,review);
 const input=d.getElementById('importprogress');
 async function restore(value){Object.defineProperty(input,'files',{configurable:true,value:[{size:JSON.stringify(value).length,text:async()=>JSON.stringify(value)}]});input.dispatchEvent(new w.Event('change'));await new Promise(r=>setImmediate(r));}
 w.localStorage.removeItem(w.courseProgress.gameKey);w.localStorage.removeItem('chinese-coach-basic-review-v98');
 await restore(data);assert(d.getElementById('backupmessage').textContent.includes('восстановлен'));
 assert.deepEqual(JSON.parse(w.localStorage.getItem(w.courseProgress.gameKey)),game);
 assert.deepEqual(JSON.parse(w.localStorage.getItem('chinese-coach-basic-review-v98')),review);
 const before=w.localStorage.getItem(w.courseProgress.gameKey);
 await restore({...data,game:{...game,points:-5}});assert(d.getElementById('backupmessage').textContent.includes('Не удалось'));assert.equal(w.localStorage.getItem(w.courseProgress.gameKey),before);
 const legacy={...data};delete legacy.game;delete legacy.basicReview;delete legacy.dailyStudy;legacy.version=3;
 await restore(legacy);assert.equal(w.localStorage.getItem(w.courseProgress.gameKey),before,'Legacy import preserves current games');
 assert(d.querySelector('.daily-start'),'Daily route available from menu');
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 d.querySelector('.daily-start').click();assert(d.querySelector('#daily-plan').open);
 assert.equal(d.querySelectorAll('[data-practice-tone]').length,4);
 assert(d.querySelector('.audit-neutral').textContent.includes('Нейтральный тон'));
 for(const [route,selector,count] of [['dialogues','[data-dialog-lesson]',4],['words','[data-clean-category]',13],['practice','[data-practice-mode]',3]]){
  const fresh=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/#topics/'+route,runScripts:'outside-only',pretendToBeVisual:true}),fw=fresh.window;
  fw.scrollTo=()=>{};fw.HTMLElement.prototype.scrollIntoView=()=>{};fw.matchMedia=()=>({matches:true});fw.URL.createObjectURL=()=>'';
  fw.speechSynthesis=w.speechSynthesis;fw.SpeechSynthesisUtterance=w.SpeechSynthesisUtterance;fw.Audio=w.Audio;
  fw.eval(code);assert.equal(fw.document.querySelectorAll(selector).length,count,'Fresh deep link '+route);fw.close();
 }
 console.log('V98 regression passed: export/import round trip, legacy import, invalid stats rejected, daily route and five-tone instruction.');
 w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close()});
