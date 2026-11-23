import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
const start=source.indexOf(' r.onresult=e=>{',source.indexOf('recognition=r;'));
const end=source.indexOf(' r.onerror=e=>{',start);
assert(start>=0&&end>start,'Active Mandarin ASR result handler must exist');
const code=source.slice(start,end);
assert(!/\bsubmit\s*\(/.test(code),'ASR must never auto-submit recognized text');

function simulate(transcript,confidence){
 const state={confidence:1,speechSignal:null};
 const message={value:'',focused:false,focus(){this.focused=true;}};
 const status=[];
 let stopped=0,failed=false;
 const handler=new Function(
  'r','valid','speechEndTimer','recognitionEndTimer','fail',
  'stopRecognition','state','$','note','clearTimeout',
  'let heard=false;\n'+code+'\nreturn r.onresult;'
 )({},()=>true,0,0,()=>{failed=true},()=>{stopped++},state,
   id=>id==='message'?message:null,text=>status.push(text),()=>{});
 handler({results:[[{transcript,confidence}]]});
 return {state,message,status,stopped,failed};
}
test('high-confidence Mandarin ASR is editable and never automatically sent',()=>{
 const x=simulate('我不喝茶',0.99);
 assert.equal(x.message.value,'我不喝茶');
 assert.equal(x.message.focused,true);
 assert.equal(x.stopped,1);
 assert.equal(x.failed,false);
 assert.equal(x.state.confidence,null);
 assert.equal(x.state.speechSignal.kind,'text-only');
 assert.equal(x.state.speechSignal.toneVerified,false);
 assert.equal(x.state.speechSignal.contentVerified,false);
 assert.match(x.status.at(-1),/Проверь текст/);
});
test('low-confidence Mandarin ASR retains original transcription for review',()=>{
 const x=simulate('跑步这么样',0.38);
 assert.equal(x.message.value,'跑步这么样');
 assert.equal(x.state.speechSignal.kind,'uncertain');
 assert.equal(x.state.speechSignal.confidence,0.38);
 assert.equal(x.state.speechSignal.toneVerified,false);
});
test('empty Mandarin ASR never sends anything',()=>{
 const x=simulate(' ',0.8);
 assert.equal(x.failed,true);
 assert.equal(x.stopped,0);
 assert.equal(x.message.value,'');
});
test('learner action still submits through explicit message form',()=>{
 assert.match(source,/\$\('message-form'\)\.addEventListener\('submit',e=>\{e\.preventDefault\(\);state\.confidence=null;submit\(\$\('message'\)\.value\)\}/);
});
