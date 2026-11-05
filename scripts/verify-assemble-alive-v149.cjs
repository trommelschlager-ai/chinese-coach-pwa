'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="game"></div>',{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window,d=w.document,played=[];
w.Audio=function(file){this.pause=()=>{};this.play=()=>{played.push(file);return Promise.resolve()}};
w.eval(fs.readFileSync('assets/human-audio-map.js','utf8'));w.eval(fs.readFileSync('assets/assemble-alive-v149.js','utf8'));w.PandaAliveCafe.mount(d.querySelector('#game'));
const q=s=>d.querySelector(s),click=s=>{assert(q(s),s);assert(!q(s).disabled,s+' disabled');q(s).click()},add=id=>click('[data-ac="add"][data-id="'+id+'"]');
assert(q('[data-ac-check]').disabled);add(1);add(0);add(2);click('[data-ac-check]');assert(q('[data-ac-message]').textContent.includes('Начни с 我'));assert.equal(q('.ac-scene').dataset.act,'idle');click('[data-ac-reset]');add(0);click('[data-ac="return"][data-id="0"]');assert.equal(q('[data-ac-answer]').children.length,1);assert(q('[data-ac-check]').disabled);
click('[data-ac="py"]');assert(!q('.ac-token small').hidden);
const lengths=[3,3,4,4,4,5],actions=['sip','sip','order','order','order','refuse'];
for(let i=0;i<6;i++){
 for(let j=0;j<lengths[i];j++)add(j);
 click('[data-ac-check]');assert.equal(q('.ac-scene').dataset.act,actions[i]);assert(q('[data-ac-reset]').disabled);assert(q('[data-ac="return"]').disabled);assert(played.at(-1).endsWith('cmn-我.mp3'));assert(q('[data-ac-check]').textContent.includes(i===5?'Завершить':'Дальше'));
 click('[data-ac-check]');
}
assert.equal(JSON.parse(w.localStorage.getItem('panda-go-alive-cafe-v1')).completed,6);assert(q('[data-ac-prompt]').textContent.includes('шесть'));click('[data-ac-check]');assert.equal(q('[data-ac-count]').textContent,'1 / 6');assert(q('[data-ac-check]').disabled);
for(const hz of ['我','喝','茶','咖啡','想','水','不'])assert(fs.existsSync(w.courseHumanAudio[hz].replace('./','')),'Local MP3 for '+hz);
const shell=fs.readFileSync('assets/panda-v130.js','utf8');assert(shell.includes("'puzzle','alive'"));assert(shell.includes("current==='alive'"));w.close();console.log('Alive café: errors, editing, pinyin, 6 scenes, local audio, completion and restart OK.');
