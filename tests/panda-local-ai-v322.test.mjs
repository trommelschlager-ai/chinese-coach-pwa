import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCAL_AI_MODEL,localAiCapability,shouldRouteToLocalAi,localTutorMessages,parseLocalTutorReply,createPandaLocalAi} from '../assets/panda-local-ai-v322.mjs';

test('AI is never required for unsupported browsers or insecure origin',()=>{
 assert.equal(localAiCapability({isSecureContext:false,navigator:{gpu:{}}}).ok,false);
 assert.equal(localAiCapability({isSecureContext:true,navigator:{},Worker:function(){}}).ok,false);
 assert.equal(localAiCapability({isSecureContext:true,navigator:{gpu:{requestAdapter(){}}},Worker:function(){}}).ok,true);
});

test('approved corrections and existing replies take priority',()=>{
 assert.equal(shouldRouteToLocalAi({kind:'correction'}),false);
 assert.equal(shouldRouteToLocalAi({kind:'question',reply:{hanzi:'你好'}}),false);
 assert.equal(shouldRouteToLocalAi({kind:'clarify',spoken:{correction:{hanzi:'我没有妹妹'}}}),false);
 assert.equal(shouldRouteToLocalAi({kind:'clarify',message:'unknown'}),true);
});

test('bounded tutor history and HSK scope, without duplicate learner input',()=>{
 const msgs=localTutorMessages('学习中文',[{who:'panda',hanzi:'你好吗？'},{who:'you',hanzi:'学习中文'}],[1,3,3,999]);
 assert.equal(msgs.at(-1).content,'学习中文');
 assert.equal(msgs.filter(m=>m.role==='user').length,1);
 assert.match(msgs[0].content,/1, 3/);
 assert.doesNotMatch(msgs[0].content,/999/);
 assert.match(msgs[0].content,/Never mark a valid fragment/);
});

test('generated text is visibly unverified and never given an invented MP3 or pinyin',()=>{
 const reply=parseLocalTutorReply('```json\n{"hanzi":"我学习中文。","ru":"Я изучаю китайский язык."}\n```');
 assert.equal(reply.hanzi,'我学习中文。');
 assert.equal(reply.pinyin,'');
 assert.equal(reply.audioKey,null);
 assert.match(reply.ru,/AI-перевод/);
 assert.throws(()=>parseLocalTutorReply('你好'),/формате/);
 assert.throws(()=>parseLocalTutorReply('{"hanzi":"Hello","ru":"Привет"}'),/неполный/);
 assert.throws(()=>parseLocalTutorReply('{"hanzi":"你好","ru":""}'),/неполный/);
});

test('opt-in engine uses prebuilt WebLLM only and fallback after stop',async()=>{
 let terminated=0,calls=0,loadedModel='';
 const engine={chat:{completions:{create:async req=>{calls++;assert.equal(req.max_tokens,180);return {choices:[{message:{content:'{"hanzi":"你好。","ru":"Привет."}'}}]};}}}};
 const ai=createPandaLocalAi({
  platform:{isSecureContext:true,navigator:{gpu:{requestAdapter:async()=>({})}},Worker:function(){}},
  loadRuntime:async()=>({
   prebuiltAppConfig:{model_list:[{model_id:LOCAL_AI_MODEL}]},
   CreateWebWorkerMLCEngine:async(worker,model)=>{loadedModel=model;return engine}
  }),
  makeWorker:()=>({terminate:()=>terminated++})
 });
 assert.equal(ai.ready,false);
 await assert.rejects(ai.reply('你好',[],[1]),/включи/);
 await ai.start();
 assert.equal(ai.ready,true);assert.equal(loadedModel,LOCAL_AI_MODEL);
 const reply=await ai.reply('你好',[],[1]);assert.equal(reply.hanzi,'你好。');
 assert.equal(calls,1);
 ai.stop();assert.equal(ai.ready,false);assert.equal(terminated,1);
 await assert.rejects(ai.reply('你好',[],[1]),/включи/);
});

test('missing WebGPU adapter fails safely without downloading',async()=>{
 let imported=false;
 const ai=createPandaLocalAi({
  platform:{isSecureContext:true,navigator:{gpu:{requestAdapter:async()=>null}},Worker:function(){}},
  loadRuntime:async()=>{imported=true;return {}}
 });
 await assert.rejects(ai.start(),/WebGPU/);
 assert.equal(imported,false);assert.equal(ai.ready,false);
});
