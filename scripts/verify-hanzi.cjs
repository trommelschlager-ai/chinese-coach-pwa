const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hanzi-lab.html','utf8');
assert(html.includes('url("./assets/meaning-china.webp")'),'Great Wall hero image must be present');
assert(html.includes('url("./assets/chinese-painting-daily.webp")'),'Landscape background must be present');
assert(fs.existsSync('assets/meaning-china.webp'),'Local hero photo must exist');
assert(fs.existsSync('assets/chinese-painting-daily.webp'),'Local landscape image must exist');
for(const label of ['大','人','小','一','二','三','口','日','月','木'])assert(html.includes("{hz:'"+label+"'"),'Missing hanzi '+label);
const scripts=[...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
assert.equal(scripts.length,1,'Exactly one inline Hanzi controller script');
new vm.Script(scripts[0]);
const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hanzi-lab.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;const d=w.document;
const voices=[{name:'Android Chinese',lang:'zh-CN',voiceURI:'zh-android',localService:true},{name:'English',lang:'en-US',voiceURI:'en'}];
const spoken=[],opened=[],modes=[],recorded=[];
w.Audio=class {
  constructor(src){this.src=src;this.playbackRate=1;this.currentTime=0}
  play(){recorded.push({src:this.src,rate:this.playbackRate});return Promise.resolve()}
  pause(){}
};
w.speechSynthesis={getVoices(){return voices},cancel(){},speak(u){spoken.push({text:u.text,lang:u.lang,voice:u.voice,rate:u.rate})},addEventListener(){}};
w.SpeechSynthesisUtterance=function(text){this.text=text};
w.HanziWriter={create(id,character,opts){opened.push(character);const stub={cancelQuiz(){},hideCharacter(){return Promise.resolve()},animateCharacter(){modes.push('animation');return Promise.resolve({canceled:false})},highlightStroke(){modes.push('hint')},quiz(handlers){modes.push('quiz');handlers.onCorrectStroke({strokeNum:0,strokesRemaining:0});handlers.onComplete({totalMistakes:0});}};Promise.resolve().then(()=>opts.onLoadCharDataSuccess());return stub}};
w.eval(scripts[0]);
(async()=>{
await new Promise(resolve=>w.addEventListener('DOMContentLoaded',resolve,{once:true}));
await Promise.resolve();
assert.equal(d.querySelectorAll('#character-tabs button').length,10,'Ten character tabs');
assert.equal(d.querySelector('#character').textContent,'大','First hanzi');
assert.equal(d.querySelector('#chinese-voice').options.length,1,'Only Chinese voices listed');
assert(!d.getElementById('animate').disabled,'Animation enabled');
d.getElementById('speak').click();
assert.equal(spoken.length,0,'Recorded voice should replace robotic TTS');
assert.equal(recorded.length,1,'Click plays human audio');
assert(recorded[0].src.includes('cmn-%E5%A4%A7.mp3'),'Recorded 大 uses correct file');
assert(modes.includes('animation'),'Character writing must start automatically');
for(const hz of ['大','人','小','一','二','三','口','日','月','木'])assert(fs.existsSync('assets/hanzi-human/cmn-'+hz+'.mp3'),'Missing recorded MP3 '+hz);
d.getElementById('animate').click();
assert(modes.includes('animation'));
d.getElementById('practice').click();
await Promise.resolve();
await Promise.resolve();
assert(modes.includes('quiz'),'Finger-drawing mode activated');
assert(d.getElementById('progress-text').textContent.includes('1 из 10'),'Completion updates progress');
d.getElementById('next').click();
await Promise.resolve();
assert.equal(d.querySelector('#character').textContent,'人','Next character loaded');
assert(opened.includes('人'));
await Promise.resolve(); await Promise.resolve();
await new Promise(resolve=>setTimeout(resolve,0));
console.log('Hanzi pilot: syntax, tabs, Chinese speech, animation, quiz and progress checks passed');
dom.window.close();
})().catch(err=>{console.error(err);process.exitCode=1});
