/* Panda AI v341 — render only the scene from the approved illustration at native proportions.
   All buttons and text are live DOM elements. No changes to dialogue engine or audio. */
import './panda-live-approved-v337.mjs?v=338';
const stage=document.querySelector('#pg-approved-v337');
if(stage&&!stage.dataset.v341){
 stage.dataset.v341='true';
 const oldArt=stage.querySelector('.v337-art');
 if(oldArt){
  const sky=document.createElement('div');sky.className='v341-sky';sky.setAttribute('aria-hidden','true');
  const hero=document.createElement('div');hero.className='v341-hero';hero.setAttribute('aria-hidden','true');
  const photo=document.createElement('div');photo.className='v341-photo';
  const img=document.createElement('img');img.className='v341-photo-image';img.src=oldArt.currentSrc||oldArt.getAttribute('src');img.alt='';img.decoding='async';img.draggable=false;
  const sakura=document.createElement('div');sakura.className='v341-sakura';
  photo.append(img,sakura);
  const water=document.createElement('div');water.className='v341-water';hero.append(photo,water);
  stage.insertBefore(sky,oldArt);stage.insertBefore(hero,oldArt);oldArt.remove();
 }
 const title=document.createElement('div');title.className='v341-title';title.textContent='Диалог с Пандой';const chat=stage.querySelector('.v337-chat');if(chat)stage.insertBefore(title,chat);
 const text=(selector,value)=>{const element=stage.querySelector(selector);if(element)element.textContent=value};
 text('.v337-back','← Назад');
 text('.v337-mode-short','Краткие диалоги');
 text('.v337-mode-nonstop','Non-Stop диалоги');
 text('.v337-history','История');
 text('.v337-topics','Все темы');
 text('.v337-send','');
 text('.v337-mic','');

 const icons={
 home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
 book:'<path d="M12 6c-4-3-8-2-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2 0-6-1-10 2Z"/><path d="M12 6v15"/>',
 game:'<path d="M6 9h12c3 0 5 2 5 6 0 2-1 4-3 4-2 0-3-3-5-3H9c-2 0-3 3-5 3-2 0-3-2-3-4 0-4 2-6 5-6Z"/><path d="M8 12v5m-2-3h4m7-1h.01m3 2h.01"/>',
 message:'<path d="M21 11.5c0 4.5-4.5 8-10 8a12 12 0 0 1-4-.7L2 21l1.5-4.2A8 8 0 0 1 1 11.5C1 7 5.5 4 11 4s10 3 10 7.5Z"/><path d="M7 11h.01M11 11h.01M15 11h.01"/>',
 person:'<circle cx="12" cy="7" r="4"/><path d="M4 22c0-5 3-8 8-8s8 3 8 8"/>',
 mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-5 0h10"/>',
 send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
 infinity:'<path d="M6.5 8C2 8 2 16 6.5 16c4.5 0 6.5-8 11-8 4.5 0 4.5 8 0 8-4.5 0-6.5-8-11-8Z"/>'
 };
 const svg=key=>'<svg viewBox="0 0 24 24" class="v341-ico" aria-hidden="true">'+(icons[key]||icons.message)+'</svg>';
 const decorate=(selector,key)=>{const n=stage.querySelector(selector);if(n)n.insertAdjacentHTML('afterbegin',svg(key))};
 decorate('.v337-mode-short','message');decorate('.v337-mode-nonstop','infinity');
 decorate('.v337-history','message');decorate('.v337-topics','layers');
 decorate('.v337-send','send');decorate('.v337-mic','mic');
 title.insertAdjacentHTML('afterbegin',svg('message'));

 const nav=document.createElement('div');nav.className='v341-nav-bg';nav.setAttribute('aria-hidden','true');
 const firstNav=stage.querySelector('.v337-bottom-link');if(firstNav)stage.insertBefore(nav,firstNav);
 const links=[['home','Главная'],['book','Уроки'],['game','Тренажёр'],['message','Panda AI'],['person','Профиль']];
 stage.querySelectorAll('.v337-bottom-link').forEach((a,i)=>{
  const [icon,label]=links[i]||['○',a.getAttribute('aria-label')||''];
  const ic=document.createElement('span');ic.className='v341-icon';ic.innerHTML=svg(icon);
  a.replaceChildren(ic,document.createTextNode(label));
  if(i===3)a.setAttribute('aria-current','page');
 });
 // Original dialogs belong to hidden main; move them into the top-level body.
 document.querySelectorAll('main > dialog').forEach(dialog=>document.body.append(dialog));
 const chatBody=stage.querySelector('.v337-chat');
 const markPlaceholders=()=>chatBody?.querySelectorAll('.v337-row').forEach(row=>{
  const empty=row.querySelector('.v337-zh')?.textContent==='Панда ждёт ответа';
  if(row.classList.contains('v341-empty')!==empty)row.classList.toggle('v341-empty',empty);
 });
 if(chatBody){
  let pending=false;
  const measure=()=>{
   pending=false;markPlaceholders();
   const r=stage.getBoundingClientRect(),c=chatBody.getBoundingClientRect();
   const heroY=Math.max(r.height*.226,Math.min(c.bottom-r.top+8,r.height*.457));
   stage.style.setProperty('--hero-top',heroY+'px');
  };
  const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(measure)}};
  markPlaceholders();schedule();
  new MutationObserver(schedule).observe(chatBody,{childList:true,subtree:true,characterData:true});
  if(window.ResizeObserver)new ResizeObserver(schedule).observe(chatBody);
  window.addEventListener('resize',schedule);
 }
 // The topic names come from the actual lesson selector, not illustrative labels.
 const topicGrid=stage.querySelector('.v337-topic-grid');
 if(topicGrid){
  const matchNames=()=>{
   const names=new Map([...document.querySelectorAll('#lesson-select option')].map(o=>[Number(o.value),o.textContent.replace(/^\d+\.\s*/, '')]));
   [...topicGrid.querySelectorAll('button')].forEach((b,i)=>{
    const name=names.get(i+1);if(!name)return;
    const emoji=b.textContent.split(' ')[0],label=emoji+' '+name;
    if(b.textContent!==label)b.textContent=label;
   });
  };
  new MutationObserver(matchNames).observe(topicGrid,{childList:true});
  matchNames();
 }
}