'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os'),path=require('node:path');
const cp=require('node:child_process'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
const context={window:{}};vm.runInNewContext(script,context,{filename:'hsk1-voices-map-v160.js'});
const female=context.window.PANDA_HSK1_VOICES.female;
const q=JSON.parse(fs.readFileSync('assets/hsk1-native-recording-queue-v168.json','utf8'));
const rows=Object.entries(female);
assert.equal(rows.length,124,'124 female voice entries expected');
assert.equal(q.items.length,56,'56 unique human recordings are still missing');
const norm=s=>s.replace(/[。？！!?.,，\s]/g,'');
for(const x of q.items){
 const matching=rows.filter(([k])=>norm(k)===x.hanzi);
 assert(matching.length>0,'No synthesized recording for '+x.hanzi);
 const source=matching.find(([k])=>k===x.display)||matching[0];
 assert(fs.existsSync(source[1].replace(/^\.\//,'')),'MP3 file missing: '+source[1]);
}
for(const [hanzi,src] of rows){assert(fs.existsSync(src.replace(/^\.\//,'')),'Missing female MP3 for '+hanzi)}
const html=fs.readFileSync('hsk1-voices-review-v169.html','utf8');
assert(html.includes('./assets/hsk1-voices-map-v160.js'));
assert(html.includes('./assets/hsk1-native-recording-queue-v168.json'));
assert(html.includes('AI_SYNTHETIC_FEMALE_NOT_HUMAN'),'Must not label synthesized voice as recorded human');
assert(html.includes('verified_by_native:false'));
assert(html.includes('zipStore(entries)'));
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];assert(inline);
new Function(inline);
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-voices-review-v169.html',runScripts:'outside-only'});
dom.window.TextEncoder=require('node:util').TextEncoder;
dom.window.fetch=async()=>({ok:true,json:async()=>q});
dom.window.eval(script);
dom.window.eval(inline);
const zipBody=inline.slice(inline.indexOf('const u16='),inline.indexOf('function downloadFile('));
assert(zipBody.includes('function zipStore(entries)'), 'No ZIP generator code');
const zipStore=new Function('const enc=new TextEncoder();'+zipBody+'return zipStore;')();
const bytes=[{name:'audio/001.mp3',bytes:Uint8Array.from([1,2,3,4,5])},{name:'manifest.json',bytes:new TextEncoder().encode('{"version":169}')}];
zipStore(bytes).arrayBuffer().then(buffer=>{
 const filename=path.join(os.tmpdir(),'panda-go-v169-zip-validate-'+process.pid+'.zip');
 try{
  fs.writeFileSync(filename,Buffer.from(buffer));
  const unzip=cp.spawnSync('unzip',['-t',filename],{encoding:'utf8'});
  assert.equal(unzip.status,0,'Invalid ZIP: '+unzip.stdout+' '+unzip.stderr);
 }finally{try{fs.unlinkSync(filename)}catch{}}
}).catch(e=>{console.error(e);process.exitCode=1});
setTimeout(()=>{
 try{
  const d=dom.window.document;
  assert.equal(d.querySelectorAll('#words article').length,56,'56 phrase cards must render');
  assert.equal(d.querySelector('#counter').textContent,'56 записей');
  assert.equal(d.querySelector('#downloadZip').disabled,false);
  assert.equal(d.querySelector('#downloadReport').disabled,true,'Empty report must be disabled');
  d.querySelector('#all').click();
  assert.equal(d.querySelectorAll('#words article').length,124,'124 full tracks must be available');
  d.querySelector('#missing').click();
  assert.equal(d.querySelectorAll('#words article').length,56);
  d.querySelector('#search').value='拼音';d.querySelector('#search').dispatchEvent(new dom.window.Event('input'));
  // Re-render is driven by search input only after listener attaches.
  d.querySelector('#search').value='';
  d.querySelector('#words article .rowBtns button:nth-child(3)').click();
  assert.equal(d.querySelector('#downloadReport').disabled,false,'QA report should be available for marked phrases');
  console.log('PASS v169: 56 existing AI MP3s all mapped, 124 full female recordings, 56/124 interactive review UI, ZIP validity and native-speaker review flags.');
  dom.window.close();
 }catch(e){console.error(e);process.exitCode=1}
},25);
