'use strict';
/* Panda Go v244: adult-voice fallback, compact screen, 8 tiles/page, old progress preserved. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-pronunciation.html','utf8');
const js=fs.readFileSync('assets/hsk1-pronunciation-v244.js','utf8');
const css=fs.readFileSync('assets/hsk1-pronunciation-v244.css','utf8');
const data=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
assert.equal(data.clips.length,190);
assert.equal(data.rules.length,21);
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Two columns required');
assert(css.includes('font-size:clamp(20px,5.9vw,25px)'),'Pinyin size should be increased');
assert(css.includes('font-size:clamp(24px,7vw,30px)'),'Chinese characters should be increased');
assert(css.includes('height:100dvh'),'App must fit viewport');
assert(!html.includes('class="stats"')&&!html.includes('class="mini-hero"'),'Remove clutter and large hero');
assert(html.includes('name="narrator"')&&html.includes('value="female"')&&html.includes('value="male"'));
for(const c of data.clips){
  assert(/^p\d{3}$/.test(c.id));
  for(const v of ['v2','v5'])assert(fs.existsSync('assets/pinyin-reading-'+v+'/'+c.id+'.mp3'),'Missing '+v+' '+c.id);
}
const exact={zi:['p058','zì','字'],ci:['p066','cí','词'],si:['p063','sì','四'],
 zhi:['p059','zhī','知'],chi:['p008','chī','吃'],shi:['p067','shì','是'],
 ji:['p028','jī','鸡'],qi:['p037','qī','七'],xi:['p056','xī','西'],
 pai:['p036','pāi','拍'],mai:['p139','mǎi','买'],nü:['p051','nǚ','女']};
for(const [unit,[id,py,hz]] of Object.entries(exact)){
  const item=data.clips.find(x=>x.id===id);
  assert.equal(item.pinyin,py,'Wrong source pitch for '+unit);
  assert.equal(item.text,hz,'Wrong source character for '+unit);
}
assert(fs.existsSync('assets/pinyin-combinations/bai.mp3'),'bái fallback audio must remain');
const map=fs.readFileSync('hsk1-map.html','utf8');
assert(map.includes('href="./hsk1-pronunciation.html"'));
assert.equal((map.match(/class="node(?: current)?"/g)||[]).length,7);
const l1=fs.readFileSync('assets/hsk1-first-v189.js','utf8');
assert(l1.includes('class="pg-pronunciation-inline"'));
const page=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-pronunciation.html',runScripts:'outside-only'});
const w=page.window,d=w.document,played=[];
w.fetch=async()=>({ok:true,json:async()=>data});
w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{played.push(src);return Promise.resolve()}};
w.eval(js);
async function tick(){await new Promise(resolve=>setImmediate(resolve))}
function click(q){const b=d.querySelector(q);assert(b,'Missing '+q);assert(!b.disabled,'Disabled '+q);b.click();return b}
function change(q,value){const el=d.querySelector(q);assert(el,'Missing '+q);el.value=value;if(el.type==='radio')el.checked=true;el.dispatchEvent(new w.Event('change',{bubbles:true}))}
async function run(){
 await tick();
 assert.equal(d.querySelectorAll('#trainer-content [data-combo]').length,8,'Only eight larger cards appear at once');
 click('#trainer-content [data-combo="zi"]');await tick();
 assert(played.at(-1).endsWith('/pinyin-reading-v2/p058.mp3'),'Primary audio should use alternative female voice, exact zì');
 assert(d.getElementById('pr-progress').textContent.includes('1 из 203'),'Keep listening progress');
 click('[data-combo-next]');
 assert.equal(d.querySelectorAll('#trainer-content [data-combo]').length,5,'Second page retains other five combos');
 click('#trainer-content [data-combo="bai"]');await tick();
 assert(played.at(-1).endsWith('/pinyin-combinations/bai.mp3'),'Unrecorded bái must remain transparent fallback');
 change('#combo-group','back');
 assert.equal(d.querySelectorAll('#trainer-content [data-combo]').length,3,'Filtered zhi/chi/shi must be visible');
 click('[data-mode="syllables"]');
 assert.equal(d.querySelectorAll('.sound-card [data-audio-id]').length,8);
 const a=[...d.querySelectorAll('.sound-card [data-audio-id]')].map(x=>x.dataset.audioId);
 click('[data-page-next]');
 const b=[...d.querySelectorAll('.sound-card [data-audio-id]')].map(x=>x.dataset.audioId);
 assert.equal(b.length,8);assert(a.every(id=>!b.includes(id)),'Pagination must replace current batch');
 let search=d.getElementById('syllable-search');search.value='xiǎo';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Search works');
 search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('[data-letter="Все"]');
 const found=new Set();let steps=0;
 while(true){[...d.querySelectorAll('.sound-card [data-audio-id]')].forEach(el=>found.add(el.dataset.audioId));const next=d.querySelector('[data-page-next]');if(!next||next.disabled)break;click('[data-page-next]');if(++steps>30)throw Error('Infinite paging')}
 assert.equal(found.size,190,'Every audio clip reachable');
 assert(d.querySelectorAll('.sound-card').length<=8,'Never stack 190 cards');
 click('[data-letter="A"]');
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0);
 click('[data-mode="tones"]');
 assert.equal(d.querySelectorAll('.rule').length,1);
 for(let i=0;i<20;i++)click('[data-rule-next]');
 assert(d.querySelector('.page-label').textContent.includes('21 / 21'));
 click('[data-quiz="mā"]');
 assert(d.getElementById('quiz-feedback').textContent.includes('Верно'));
 click('[data-quiz-next]');
 assert(d.querySelector('#record-start')&&d.querySelector('#record-replay').disabled);
 click('#footer-next');
 assert(d.querySelector('#practice-dialog').open);
 click('#practice-play');await tick();
 assert(played.at(-1).endsWith('/pinyin-reading-v2/p076.mp3'),'Tone clip uses female variant');
 change('input[name="narrator"][value="male"]','male');
 click('#practice-play');await tick();
 assert(played.at(-1).endsWith('/pinyin-reading-v5/p076.mp3'),'Male voice option should switch all sample audio');
 click('#practice-close');assert(!d.querySelector('#practice-dialog').open);
 click('[data-mode="combos"]');
 click('#trainer-content [data-combo="zi"]');await tick();
 assert(played.at(-1).endsWith('/pinyin-reading-v5/p058.mp3'),'Adult voice switch must apply to combos too');
 assert.equal(w.localStorage.getItem('pg-hsk1-narrator-v244'),'male');
 assert(Object.keys(w.localStorage).includes('pg-hsk1-pronunciation-v242'),'Progress key unchanged');
 console.log('PASS Panda Go v244: 13 combo links, exact tones, 190 recordings with two narrator options, 8-card paging, larger Hanzi and pinyin, microphone and preserved progress.');
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>page.window.close());
