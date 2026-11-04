/* Airport voice add-on regression. Requires only jsdom and bundled source files. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
(async()=>{
 const html=fs.readFileSync('travel.html','utf8');
 const js=fs.readFileSync('assets/travel-voice-v1.js','utf8');
 const css=fs.readFileSync('assets/travel-voice-v1.css','utf8');
 assert(html.includes('travel-voice-v1.js?v=3'));
 assert(html.includes('travel-voice-v1.css?v=2'));
 assert(css.includes('.travel-voice .voice-action-card'));
 assert(!js.includes('92%'),'No fabricated pronunciation rating');
 assert(js.includes('Распознавание слов не означает правильность всех китайских тонов.'));
 const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/travel.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;w.scrollTo=()=>{};w.Audio=function(){this.play=()=>Promise.resolve();this.pause=()=>{};};
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
 w.URL.createObjectURL=()=> 'blob:mock';w.URL.revokeObjectURL=()=>{};
 const legacy=[...d.querySelectorAll('script:not([src])')].map(x=>x.textContent).join('\n');
 w.eval(legacy);w.eval(js);
 assert.equal(d.querySelectorAll('#voice-open').length,1);
 assert.equal(d.querySelectorAll('#task-content').length,1,'Existing quiz preserved');
 assert.equal(d.querySelectorAll('#voice-progress').length,1);
 assert.equal(d.querySelectorAll('.stop').length,4,'Map preserved');
 const qa=w.__travelVoiceQA;assert(qa);
 d.getElementById('reward-screen').hidden=false;
 d.getElementById('voice-open').click();
 assert.equal(qa.getScreen(),'visible');
 assert.equal(qa.getStep(),0);
 assert.equal(d.getElementById('voice-zh').textContent,'你好！');
 assert.equal(d.getElementById('voice-py').textContent,'Nǐ hǎo!');
 assert(d.getElementById('voice-result').textContent.includes('недоступна'));
 d.getElementById('voice-pinyin').click();
 assert.equal(d.getElementById('voice-py').hidden,true);
 d.getElementById('voice-pinyin').click();
 assert.equal(d.getElementById('voice-py').hidden,false);
 let rec;
 class MockSpeech {
  constructor(){this.lang='';this.maxAlternatives=0;rec=this}
  start(){}
  abort(){}
 }
 w.SpeechRecognition=MockSpeech;
 // Enter next exercise, now speech recognition becomes available.
 d.getElementById('voice-next').click();
 assert.equal(d.getElementById('voice-zh').textContent,'我是俄罗斯人。你呢？');
 assert.equal(d.getElementById('voice-recognize').disabled,false);
 d.getElementById('voice-recognize').click();
 assert.equal(rec.lang,'zh-CN');
 assert.equal(rec.maxAlternatives,3);
 rec.onresult({results:[[{transcript:'我是俄罗斯人你呢'}]]});
 assert.equal(qa.getAttempts(),1);
 assert(d.getElementById('voice-result').textContent.includes('не проверка тонов'));
 // Test error and restart: no false score for a denied microphone.
 d.getElementById('voice-recognize').click();
 rec.onerror({error:'not-allowed'});
 assert(d.getElementById('voice-result').textContent.includes('запрещён'));
 assert.equal(qa.getAttempts(),1);
 d.getElementById('voice-next').click();
 assert.equal(d.getElementById('voice-zh').textContent,'谢谢！');
 // Even without speech engine, learner can record, skip, and return.
 delete w.SpeechRecognition;
 d.getElementById('voice-next').click();
 assert.equal(d.getElementById('voice-end').hidden,false);
 assert.equal(w.localStorage.getItem('panda-go-travel-voice-v1'),null,'Never award unattempted phrases');
 assert(d.getElementById('voice-end-text').textContent.includes('1 из 3'));
 d.getElementById('voice-close').click();
 assert.equal(qa.getScreen(),'hidden');
 assert.equal(d.getElementById('reward-screen').hidden,false);
 // Returning learner can access voice practice directly from the map.
 const mapStatus=d.getElementById('airport-status');
 mapStatus.textContent='Пройдено ✓ · Повторить';
 await Promise.resolve();
 assert.equal(d.getElementById('voice-from-map').hidden,false);
 d.getElementById('voice-from-map').click();
 assert.equal(d.getElementById('map-screen').hidden,true);
 assert.equal(qa.getScreen(),'visible');
 d.getElementById('voice-close').click();
 assert.equal(d.getElementById('map-screen').hidden,false);
 // Existing quiz progress is not modified.
 assert.equal(w.localStorage.getItem('panda-go-travel-v1'),null);
 w.close();
 console.log('Travel voice checks passed: 3 phrases, speech-result honesty, pinyin, optional skip, safe return, old quiz preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});