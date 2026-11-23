/* Panda Go · opt-in live dialogue -> local Panda Memory v1
 * Additive hook on the existing history dialog, with NO changes to Panda
 * brain, microphone, MP3 registry, lessons, artwork or existing chat controls.
 * Browser/device-local pilot until user-account binding + privacy review exist.
 */
import {
  createPandaMemoryStore,normalizePandaChinese,
  preparePandaMemoryCandidate,fetchApprovedPandaMp3
} from './panda-offline-memory-v1.mjs';
import {PANDA_MEMORY_SAMPLES_V1 as APPROVED} from './panda-memory-reviewed-samples-v1.mjs';

export const PANDA_LIVE_OWNER_KEY='panda-memory-device-owner-v1';
const MAX_CANDIDATE_CHARS=500;
const BAD_REPLY=/我没听懂|你可以用简单一点|换一种说法|请再说一遍|我不明白|听不清楚/;
const fromBase=()=>location.hostname==='panda.localhost'?
  'https://trommelschlager-ai.github.io/chinese-coach-pwa/':
  new URL('./',location.href).href;

export function eligibleLivePandaPair(history){
  if(!Array.isArray(history)||history.length<2)return null;
  const tail=history[history.length-1],prev=history[history.length-2];
  // A question only, a correction example or an unknown ASR transcript
  // is not a verified learner->Panda exchange.
  if(tail?.who!=='panda'||prev?.who!=='you')return null;
  if(prev.confidence!=null&&prev.confidence<.65)return null;
  if(prev.analysis?.kind==='unknown'||prev.analysis?.uncertain)return null;
  const trigger=typeof prev.hanzi==='string'?prev.hanzi.trim():'';
  const answer=typeof tail.hanzi==='string'?tail.hanzi.trim():'';
  const pinyin=typeof tail.pinyin==='string'?tail.pinyin.trim():'';
  const ru=typeof tail.ru==='string'?tail.ru.trim():'';
  if(!trigger||!answer||!pinyin||!ru||[trigger,answer,pinyin,ru].some(s=>[...s].length>MAX_CANDIDATE_CHARS))return null;
  if(!/\p{Script=Han}/u.test(trigger)||!/\p{Script=Han}/u.test(answer)||BAD_REPLY.test(answer))return null;
  if(/пока не подтвержд|возможный смысл|не поняла|не понимаю/i.test(ru))return null;
  const reviewed=APPROVED.find(x=>normalizePandaChinese(x.trigger)===normalizePandaChinese(trigger)&&
    normalizePandaChinese(x.answer)===normalizePandaChinese(answer))||null;
  return {trigger,answer,pinyin,ru,topic:reviewed?.topic||'conversation',level:'HSK2',reviewed};
}

function ownerId(storage){
  let id;
  try{id=storage.getItem(PANDA_LIVE_OWNER_KEY)}catch{}
  if(typeof id==='string'&&/^device-[a-zA-Z0-9_-]{12,90}$/.test(id))return id;
  if(!globalThis.crypto?.randomUUID)throw Error('Secure local device identity unavailable');
  id='device-'+crypto.randomUUID();
  storage.setItem(PANDA_LIVE_OWNER_KEY,id);
  return id;
}

export async function saveLivePandaPair(pair,{store,owner,baseUrl,consent,fetcher}){
  if(consent!==true)throw new Error('MEMORY_CONSENT_REQUIRED');
  if(!pair)throw new Error('Нет подходящей пары реплик для сохранения');
  const topic=pair.reviewed?.topic||'conversation';
  const draft={
    ownerId:owner,topic,level:'HSK2',trigger:pair.trigger,
    answer:pair.answer,pinyin:pair.pinyin,ru:pair.ru,consent:true
  };
  const candidate=preparePandaMemoryCandidate(draft);
  const already=await store.recall({ownerId:owner,topic,trigger:pair.trigger});
  if(already)return {status:'already-installed',offlineReady:true};
  await store.stage(draft);
  // Only content reviewed in the OWNER'S hardcoded course catalog can use
  // the approved MP3. Any other text is stored as pending, never as "correct".
  const reviewed=pair.reviewed;
  if(!reviewed)return {status:'pending-review',offlineReady:false};
  if(normalizePandaChinese(reviewed.answer)!==normalizePandaChinese(pair.answer))
    throw Error('Reviewed response mismatch');
  if(normalizePandaChinese(reviewed.pinyin)!==normalizePandaChinese(pair.pinyin)||
     reviewed.ru.trim()!==pair.ru.trim())return {status:'pending-review',offlineReady:false};
  if(reviewed.voiceId!=='voice-093')throw Error('Unapproved voice');
  const audioBlob=await fetchApprovedPandaMp3(reviewed.src,{baseUrl,fetcher});
  await store.approve({candidate,reviewRef:reviewed.reviewRef,source:'approved-course-audio',
    audioBlob,voiceId:'voice-093'});
  return {status:'offline-ready',offlineReady:true,bytes:audioBlob.size};
}

export function mountPandaLiveMemory({
 bridge=globalThis.PandaApprovedBridge337,historyRoot=document.getElementById('history'),
 historyDialog=document.getElementById('history-dialog'),storage=localStorage,
 store=createPandaMemoryStore(),baseUrl=fromBase()
}={}){
 if(!bridge?.snapshot||!historyRoot||!historyDialog)return null;
 if(document.getElementById('panda-memory-live-controls'))return null;
 const owner=ownerId(storage);
 const controls=document.createElement('section');
 controls.id='panda-memory-live-controls';
 controls.setAttribute('aria-label','Личная офлайн-память Панды');
 controls.innerHTML=`
 <h3>🧠 Память Панды</h3>
 <p>Сохраняем полезные фразы из текущего диалога. Только на этом устройстве, не для всех учеников.</p>
 <label class="pml-consent"><input type="checkbox" id="pml-consent"> Разрешаю сохранять мои сообщения и ответы Панды на этом устройстве.</label>
 <label class="pml-consent"><input type="checkbox" id="pml-auto" disabled> Автоматически сохранять следующие подходящие пары реплик в этой вкладке.</label>
 <div class="pml-actions"><button type="button" id="pml-save">💾 Сохранить последнюю пару</button><button type="button" id="pml-check">🔎 Проверить память</button></div>
 <p id="pml-status" role="status" aria-live="polite">Сначала отметь согласие, затем говори с Пандой.</p>
 <p id="pml-count">Сохранённые фразы: проверяю…</p>
 <p class="pml-warning">✅ Проверенные фразы с точным MP3 Xiaoxiao работают офлайн. Новые ответы сохраняются с пометкой «Ждёт проверки» и пока не используются как правильные. Это память браузера, не привязанная к аккаунту; на общем телефоне её могут видеть другие пользователи этого браузера.</p>
 `;
 historyDialog.append(controls);
 const css=document.createElement('style');
 css.id='panda-memory-live-controls-css';
 css.textContent=`
 #panda-memory-live-controls{padding:12px 11px;margin:10px 0;background:#f8f3ff;border:1px solid #dfd0f0;border-radius:15px;color:#3e2f59;font:13px/1.4 system-ui,sans-serif}
 #panda-memory-live-controls h3{margin:0 0 5px;font-size:16px}
 #panda-memory-live-controls p{margin:5px 0}
 #panda-memory-live-controls .pml-consent{display:flex;align-items:flex-start;gap:9px;margin:9px 0;font-weight:600}
 #panda-memory-live-controls input{accent-color:#7755b8;width:18px;height:18px;flex:0 0 18px;margin:2px 0 0}
 #panda-memory-live-controls .pml-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
 #panda-memory-live-controls button{min-height:42px;border-radius:10px;padding:9px 12px;background:#7452b5;color:#fff;font-weight:700;border:0;flex:1 1 120px}
 #panda-memory-live-controls button:disabled{opacity:.52}
 #panda-memory-live-controls .pml-warning{font-size:11px;color:#736482}
 #pml-status{min-height:20px;font-weight:700}
 #pml-count{font-size:12px;color:#6f5c8b}
 `;
 document.head.append(css);
 const $=id=>controls.querySelector('#'+id),consent=$('pml-consent'),auto=$('pml-auto');
 const note=text=>{$('pml-status').textContent=text};
 let lastSeen='',writing=false;
 const latest=()=>eligibleLivePandaPair(bridge.snapshot().history);
 const signature=pair=>pair?.trigger+'|'+pair?.answer+'|'+pair?.pinyin;
 async function counts(){
  try{
   const cards=await store.list(owner);
   const ready=cards.filter(c=>c.status==='offline-ready').length;
   $('pml-count').textContent='На устройстве: '+cards.length+' · с MP3: '+ready+' · ждут проверки: '+(cards.length-ready);
  }catch(e){$('pml-count').textContent='Локальная память недоступна: '+e.message}
 }
 async function save(pair,manual=false){
  if(!consent.checked){if(manual)note('Сначала подтверди согласие на сохранение.');return}
  if(!pair){if(manual)note('Нужна последняя пара «Ты → Панда» с проверенным пиньинем и переводом.');return}
  if(writing)return;
  writing=true;$('pml-save').disabled=true;
  try{
   const result=await saveLivePandaPair(pair,{store,owner,baseUrl,consent:true});
   note(result.offlineReady?'✅ Фраза и MP3 Xiaoxiao сохранены для офлайна.':
     '📝 Фраза сохранена локально, но ждёт проверки и записи Xiaoxiao.');
   await counts();
  }catch(e){
   note('Не удалось завершить сохранение: '+e.message);
  }finally{writing=false;$('pml-save').disabled=false}
 }
 consent.addEventListener('change',()=>{
  auto.disabled=!consent.checked;
  if(!consent.checked){auto.checked=false;note('Сохранение новых фраз отключено. Ранее сохранённые записи остаются локально.')}
  else note('Согласие включено только в этой вкладке. Можно сохранить последнюю пару.');
  lastSeen=signature(latest());
 });
 auto.addEventListener('change',()=>{
  lastSeen=signature(latest());note(auto.checked?'Новые подходящие пары будут сохраняться на устройстве.':'Автосохранение выключено.');
 });
 $('pml-save').addEventListener('click',()=>save(latest(),true));
 $('pml-check').addEventListener('click',async()=>{
  const pair=latest();
  if(!pair){note('Нет подходящей последней пары реплик.');return}
  try{
   const card=await store.recall({ownerId:owner,topic:pair.reviewed?.topic||'conversation',trigger:pair.trigger});
   note(card?'✅ Сохранён ответ «'+card.answer+'» и MP3 Xiaoxiao.':'Ещё нет готового офлайн-ответа. Непроверенную фразу нельзя озвучить как утверждённую.');
  }catch(e){note('Ошибка памяти: '+e.message)}
 });
 const observer=new MutationObserver(()=>{
  if(!auto.checked||!consent.checked)return;
  const pair=latest(),key=signature(pair);
  if(!pair||key===lastSeen)return;
  lastSeen=key;save(pair,false);
 });
 observer.observe(historyRoot,{childList:true});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 counts();
 return {controls,counts,latest};
}

if(typeof window!=='undefined'){
 let attempts=0;
 const attach=()=>{
  if(document.getElementById('panda-memory-live-controls'))return;
  if(mountPandaLiveMemory())return;
  if(++attempts<150)setTimeout(attach,100);
 };
 attach();
}
