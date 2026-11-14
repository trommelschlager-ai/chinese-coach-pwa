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
 const title=document.createElement('div');title.className='v341-title';title.textContent='☏ Диалог с Пандой';const chat=stage.querySelector('.v337-chat');if(chat)stage.insertBefore(title,chat);
 const text=(selector,value)=>{const element=stage.querySelector(selector);if(element)element.textContent=value};
 text('.v337-back','← Назад');
 text('.v337-mode-short','☏ Краткие диалоги');
 text('.v337-mode-nonstop','∞ Non-Stop диалоги');
 text('.v337-history','◷ История');
 text('.v337-topics','▱\nВсе темы');
 text('.v337-send','➤');
 text('.v337-mic','🎙');
 const nav=document.createElement('div');nav.className='v341-nav-bg';nav.setAttribute('aria-hidden','true');
 const firstNav=stage.querySelector('.v337-bottom-link');if(firstNav)stage.insertBefore(nav,firstNav);
 const links=[['⌂','Главная'],['▤','Уроки'],['♧','Тренажёр'],['☏','Panda AI'],['♙','Профиль']];
 stage.querySelectorAll('.v337-bottom-link').forEach((a,i)=>{
  const [icon,label]=links[i]||['○',a.getAttribute('aria-label')||''];
  const ic=document.createElement('span');ic.className='v341-icon';ic.textContent=icon;
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
 if(chatBody){markPlaceholders();new MutationObserver(markPlaceholders).observe(chatBody,{childList:true})}
}