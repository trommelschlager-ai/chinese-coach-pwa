// Panda Go v322: opt-in local inference. Keep verified Panda Brain as the default.
// This module NEVER starts a download automatically and NEVER invents voice/audio.
export const LOCAL_AI_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const RUNTIME_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.86';
const HANZI = /[\u3400-\u9fff]/u;
const clean = value => String(value ?? '').trim();

export function localAiCapability(platform = globalThis) {
 if (platform.isSecureContext === false) return {ok:false, reason:'Локальный AI требует HTTPS.'};
 if (!platform.navigator?.gpu?.requestAdapter) return {ok:false, reason:'В этом браузере нет WebGPU. Проверенные диалоги Панды продолжат работать.'};
 if (typeof platform.Worker !== 'function') return {ok:false, reason:'Браузер не поддерживает Web Workers.'};
 return {ok:true, reason:'Можно попробовать загрузить локальную модель.'};
}

// Never let an unverified model replace authored corrections, MP3 or translations.
export function shouldRouteToLocalAi(result) {
 return result?.kind === 'clarify' && !result?.spoken?.correction && !result?.reply;
}

export function localTutorMessages(input, history = [], unlocked = [1]) {
 const allowed = [...new Set(unlocked.filter(n=>Number.isInteger(n)&&n>=1&&n<=7))].sort((a,b)=>a-b);
 const system = [
  'You are Panda Go, a beginner Chinese conversation tutor for Russian-speaking students.',
  'Use only simple practical Chinese at HSK 1 level and approved bridge expressions: 中文, 学习, 忙, 很.',
  'Unlocked HSK1 lesson numbers: '+allowed.join(', ')+'. Do not claim paid HSK2 lessons are unlocked.',
  'Respond politely to a learner in Chinese and include a short Russian meaning.',
  'Ask at most one simple related follow-up question, only if natural.',
  'Do not invent personal facts, weather forecasts or dates. If uncertain ask for clarification.',
  'Do not claim to hear, measure or grade tones or pronunciation: you receive recognized TEXT, not acoustic data.',
  'Never mark a valid fragment like 学习中文 as a grammatical mistake; you may suggest 我学习中文 as a complete sentence.',
  'Return ONLY a JSON object with exactly two keys: "hanzi" (short Chinese response, maximum 35 Chinese characters) and "ru" (brief Russian translation, maximum 160 characters).',
  'Do NOT output pinyin, tone marks, phonetic grades, Markdown or analysis. Avoid English.'
 ].join(' ');
 const recent = (Array.isArray(history)?history:[])
  .filter(row=>row && (row.who==='you'||row.who==='panda') && clean(row.hanzi))
  .slice(-8).map(row=>({role:row.who==='you'?'user':'assistant',content:clean(row.hanzi).slice(0,130)}));
 // The screen records the learner utterance before routing; avoid sending it twice.
 if(recent.at(-1)?.role==='user' && recent.at(-1)?.content===clean(input))recent.pop();
 return [{role:'system',content:system},...recent,{role:'user',content:clean(input).slice(0,160)}];
}

export function parseLocalTutorReply(raw) {
 const value = clean(raw);
 const match = value.match(/\{[\s\S]*\}/);
 if(!match || match[0].length>1400)throw new Error('AI не вернул учебный ответ в проверяемом формате.');
 let data;
 try{data=JSON.parse(match[0])}catch{throw new Error('AI ответил в неподдерживаемом формате.')}
 const hanzi=clean(data?.hanzi).replace(/[\r\n]+/g,' ').slice(0,120);
 const ru=clean(data?.ru).replace(/[\r\n]+/g,' ').slice(0,250);
 if(!HANZI.test(hanzi) || hanzi.length>75 || !ru || ru.length>180 || /[<>]/.test(hanzi+ru))
  throw new Error('AI выдал неполный или слишком длинный ответ.');
 // No invented MP3, acoustic assessment or unverified pinyin.
 return {hanzi,pinyin:'',ru:'AI-перевод (проверь): '+ru,audioKey:null,source:'local-ai'};
}

export function createPandaLocalAi({
 platform=globalThis,
 loadRuntime=()=>import(RUNTIME_URL),
 makeWorker=()=>new Worker(new URL('./panda-local-worker-v322.mjs',import.meta.url),{type:'module'})
}={}) {
 let engine=null,worker=null,starting=false;
 const api={
  get ready(){return Boolean(engine)},
  get loading(){return starting},
  async start(onProgress=()=>{}){
   if(engine)return;
   if(starting)throw new Error('AI уже загружается.');
   const capability=localAiCapability(platform);
   if(!capability.ok)throw new Error(capability.reason);
   starting=true;
   try {
    const adapter=await platform.navigator.gpu.requestAdapter();
    if(!adapter)throw new Error('WebGPU не разрешён на устройстве. Используй обычную Панду.');
    onProgress('Загружаю движок AI. Первый запуск скачивает крупную модель — желательно Wi-Fi.');
    const runtime=await loadRuntime();
    if(!runtime.prebuiltAppConfig?.model_list?.some(item=>item.model_id===LOCAL_AI_MODEL))
     throw new Error('В загруженной версии WebLLM нет выбранной маленькой модели.');
    worker=makeWorker();
    const loaded=await runtime.CreateWebWorkerMLCEngine(worker,LOCAL_AI_MODEL,{
     initProgressCallback:report=>onProgress(clean(report?.text)||'Загружается AI-модель…')
    });
    if(!worker){try{await loaded.unload?.()}catch{}throw new Error('Загрузка была отменена.')}
    engine=loaded;
    onProgress('✅ Локальный AI готов. Новые ответы будут текстовыми, без записи носительницы.');
   } catch(error) {
    worker?.terminate();worker=null;engine=null;
    throw error;
   } finally {starting=false}
  },
  async reply(input,history,unlocked){
   if(!engine)throw new Error('Сначала включи локальный AI в подсказках.');
   const response=await engine.chat.completions.create({
    messages:localTutorMessages(input,history,unlocked),temperature:0.2,top_p:0.8,
    max_tokens:180,stream:false
   });
   return parseLocalTutorReply(response?.choices?.[0]?.message?.content);
  },
  stop(){
   const current=worker;worker=null;engine=null;starting=false;
   try{current?.terminate()}catch{}
  }
 };
 return api;
}
