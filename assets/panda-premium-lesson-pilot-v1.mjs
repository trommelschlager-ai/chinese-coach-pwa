import {createStudyStore} from './panda-premium-study-v1.mjs';
import {startLife,lifeTurn,submitLife} from './panda-life-premium-v1.mjs';
import {analyseMirrorBuffers} from './panda-mirror-premium-v1.mjs';
import {createPremiumMotion} from './panda-premium-motion-v1.mjs';

export function mountPilot({workspace,app,words,clips,normalize,getState,completed,clearMedia}){
 const ownerKey='panda-premium-pilot-local-owner-v1';
 let store=null,previousStep=null,life=null,recording=null,stream=null,player=null,url=null,epoch=0,finished=false;
 const motion=createPremiumMotion();
 function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
 function btn(label,fn){const b=node('button',label);b.type='button';b.className='soft';b.addEventListener('click',()=>{motion.press(b);Promise.resolve().then(fn).catch(e=>{status(e.message||'Не удалось выполнить действие.');});});return b;}
 function status(text){const el=workspace.querySelector('[data-premium-status]');if(el)el.textContent=text;}
 function getStore(){try{const id=localStorage.getItem(ownerKey);return id?createStudyStore(localStorage,id):null;}catch{return null;}}
 store=getStore();
 function consent(){if(!store){const id=crypto.randomUUID();localStorage.setItem(ownerKey,id);store=createStudyStore(localStorage,id);}render();}
 function stopMedia(){epoch++;if(recording&&recording.state!=='inactive')recording.stop();recording=null;stream?.getTracks().forEach(t=>t.stop());stream=null;player?.pause();player=null;if(url){URL.revokeObjectURL(url);url=null;}}
 async function play(src){if(!src)throw Error('Запись недоступна');clearMedia();player?.pause();player=new Audio(src);await player.play();}
 function panel(title){const p=node('section');p.className='panel';p.dataset.premiumPilot='';p.append(node('h2',title));return p;}
 function addStatus(p){const s=node('p','');s.dataset.premiumStatus='';s.setAttribute('role','status');p.append(s);}
 function render(){
  stopMedia();const step=getState().step;workspace.querySelectorAll('[data-premium-pilot]').forEach(n=>n.remove());
  if(previousStep!==null&&previousStep!==step&&step!==1&&step!==8)motion.step(workspace.firstElementChild);
  previousStep=step;
  if(step===8){if(completed()&&!finished){finished=true;motion.complete(workspace.querySelector('.final-hero'),{confirmed:true});}return;}
  if(![2,3,5,6,7].includes(step))return;
  const p=panel('PANDA PREMIUM · тест функций');
  addStatus(p);
  if(!store){p.append(node('p','По желанию: сохранять ошибки и подтверждённые рассказы в этом браузере. Это локальный тестовый профиль, не аккаунт.'),btn('Включить локальную память',consent));}
  else {p.append(btn('Удалить локальную память и рассказы',()=>{store.clear();localStorage.removeItem(ownerKey);store=null;render();}));}
  if(step===3&&getState().quizTest===null&&store)memory(p);
  if(step===5&&store)story(p);
  if(step===6)mirror(p);
  if(step===7&&completed())lifePanel(p);
  workspace.append(p);
 }
 function memory(p){
  p.append(node('h3','PANDA MEMORY'));
  const due=store.due(Date.now()).filter(c=>c.lessonId==='hsk2-1');
  p.append(node('p','К повторению: '+due.length));
  if(!due.length)return;
  const c=due[0],idx=Number(c.wordId.split('-')[1]),w=words[idx];if(!w)return;
  p.append(node('strong',w.zh+' · '+w.py));
  for(const item of words)p.append(btn(item.ru,()=>{const correct=item===w;store.record({lessonId:c.lessonId,wordId:c.wordId,correct,now:Date.now()});if(correct)render();else status('Пока неверно. Попробуй ещё раз.');}));
 }
 function story(p){
  p.append(node('h3','PANDA STORY BOOK'),node('p','Сохраняются только явно подтверждённые фразы. Проверь перевод и убери примеры, которые не относятся к тебе.'));
  const rows=Array.from(workspace.querySelectorAll('.about-personal-line')).map(n=>({zh:n.querySelector('strong')?.textContent||'',py:n.querySelector('.py')?.textContent||''}));
  if(rows.length){
   const fields=rows.map((r,i)=>{const label=node('label',r.zh+' · '+r.py);const input=node('input');input.type='text';input.placeholder='Точный перевод на русский';input.maxLength=500;label.append(input);p.append(label);return input;});
   p.append(btn('Подтверждаю рассказ · сохранить',()=>{if(!window.confirm('Все шесть фраз действительно о тебе? Сохранить их локально?'))return;store.saveStory({lessonId:'hsk2-1',title:'О себе',confirmed:true,now:Date.now(),lines:rows.map((r,i)=>({...r,ru:fields[i].value}))});render();status('Рассказ сохранён.');}));
  }
  for(const book of store.stories()){p.append(node('h3',book.title));for(const l of book.lines)p.append(node('p',l.zh+' · '+l.py+' · '+l.ru));p.append(btn('Удалить рассказ',()=>{store.deleteStory(book.lessonId);render();}));}
 }
 function lifePanel(p){
  p.append(node('h3','PANDA LIFE · Знакомство'));
  if(!life||life.done){if(life?.done)p.append(node('p','Сценарий пройден: 3 вопроса.'));p.append(btn('Начать разговор',()=>{life=startLife('introduction',[1]);render();}));return;}
  const t=lifeTurn(life);p.append(node('p',t.prompt.zh+' · '+t.prompt.py+' · '+t.prompt.ru),btn('🔊 Вопрос',()=>play(t.prompt.audio)));
  const input=node('input');input.placeholder='Ответ по-китайски';p.append(input,btn('Отправить ответ',()=>{const result=submitLife(life,{text:input.value,method:'typed'});if(result.status==='accepted'){life=result.state;render();}else status(result.message);}));
  for(const a of t.answers)p.append(btn(a.zh+' · '+a.py,()=>{life=submitLife(life,{text:a.zh,method:'choice'}).state;render();}));
 }
 function mirror(p){
  p.append(node('h3','PANDA MIRROR · má · второй тон'),node('p','Слушай образец и запиши один слог. Анализ не оценивает правильность тона.'));
  const src='./assets/hsk1-tone-clean-v202/ma2.mp3';
  const listen=btn('🔊 Образец',()=>play(src));
  const stop=btn('■ Остановить',()=>{if(recording?.state==='recording')recording.stop();});stop.disabled=true;
  const start=btn('🎙 Записать',async()=>{
   if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw Error('Запись не поддерживается.');
   const current=++epoch;clearMedia();player?.pause();start.disabled=true;
   let acquired;try{acquired=await navigator.mediaDevices.getUserMedia({audio:true});if(current!==epoch){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;recording=new MediaRecorder(stream);}catch(e){acquired?.getTracks().forEach(t=>t.stop());start.disabled=false;throw e;}
   const rec=recording,parts=[];rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
   rec.onstop=async()=>{acquired.getTracks().forEach(t=>t.stop());if(current!==epoch)return;recording=null;stream=null;start.disabled=false;stop.disabled=true;
    const blob=new Blob(parts,{type:rec.mimeType});if(!blob.size){status('Запись пустая.');return;}
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);
    replay.disabled=false;const AudioCtx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioCtx){status('Анализ аудио недоступен.');return;}
    const ctx=new AudioCtx();try{const response=await fetch(src);if(!response.ok)throw Error('Образец недоступен');const [a,b]=await Promise.all([ctx.decodeAudioData(await response.arrayBuffer()),ctx.decodeAudioData(await blob.arrayBuffer())]);if(current!==epoch)return;const result=analyseMirrorBuffers(a,b,{singleSyllable:true});status(result.message);if(result.available){graph.replaceChildren();draw(result,graph);}}catch(e){status(e.message||'Анализ недоступен.');}finally{await ctx.close().catch(()=>{});}
   };
   rec.start();stop.disabled=false;setTimeout(()=>{if(rec.state==='recording')rec.stop();},3000);
  });
  const replay=btn('🔊 Моя запись',()=>play(url));replay.disabled=true;const graph=node('div');p.append(listen,start,stop,replay,graph);
 }
 function draw(result,host){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 300 140');svg.setAttribute('width','100%');svg.setAttribute('role','img');svg.setAttribute('aria-label','Высота голоса: золотая линия — образец, зелёная — ученик');
  const max=Math.max(2,...[...result.reference.points,...result.learner.points].map(p=>Math.abs(p.semitones)));
  for(const [curve,color] of [[result.reference,'#b88a35'],[result.learner,'#25805b']]){const path=document.createElementNS(ns,'polyline');path.setAttribute('points',curve.points.map(p=>(10+p.x*280)+','+(70-p.semitones/max*58)).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width','3');svg.append(path);}
  host.append(svg,node('p','Золотой — образец; зелёный — ученик.'));
 }
 window.addEventListener('pagehide',()=>{stopMedia();motion.reset();});
 return {render,quizResult(type,index,correct){if(!store)return;try{store.record({lessonId:'hsk2-1',wordId:'w-'+index,correct,now:Date.now()});}catch(e){status('Память недоступна: '+e.message);}}};
}
