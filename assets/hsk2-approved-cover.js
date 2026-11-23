/* Approved Panda Go HSK2 full-cover artwork, lessons 1–10.
 * The old intro remains fully functional if an approved poster asset is missing.
 * This changes only the intro visual. Lessons, voice, tests and progress are untouched.
 */
(function(){
 'use strict';
 const names=['О себе','Мой день','Работа и учёба','Моё хобби','Друзья и встречи','Вчера и мой опыт','Мои планы на будущее','В магазине','Здоровье и самочувствие','Любовь и отношения'];
 const labels=['Новые слова','Тесты','Грамматика','Тематический рассказ','Произношение','Диалог'];
 const num=Number(document.currentScript?.dataset.lesson||0);
 if(!Number.isInteger(num)||num<1||num>10)return;
 const art='./assets/hsk2-approved-covers/lesson-'+String(num).padStart(2,'0')+'.png'+(num===1?'?v=20261123back1':'');
 const thematicArt='./assets/hsk2-approved-covers/lesson-'+String(num).padStart(2,'0')+'-scene.webp';
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const loading=new WeakSet();
 function build(img){
  const steps=(num===1?[45.3,52.7]:[46.5,54.5]).map((y,row)=>[4.6,35.6,66.6].map((x,col)=>{
   const step=row*3+col+2;
   return '<button type="button" class="pg-approved-hotspot" data-step="'+step+'" aria-label="'+esc(labels[step-2])+'" style="left:'+x+'%;top:'+y+'%;width:28.9%;height:'+(num===1?(row===0?'7.25':'7.9'):'7.8')+'%"></button>';
  }).join('')).join('');
  const section=document.createElement('section');
  section.className='pg-approved-overlay pg-approved-lesson-'+num;
  section.setAttribute('aria-label','HSK 2. Урок '+num+'. '+names[num-1]);
  section.innerHTML='<div class="pg-approved-poster">'+
   '<img class="pg-approved-cover-image" width="941" height="1672" draggable="false" decoding="async" alt="HSK 2. Урок '+num+'. '+esc(names[num-1])+'">'+
   '<a class="pg-approved-hotspot pg-approved-map-link" href="./hsk2-life-course.html?view=map" aria-label="Все уроки HSK 2"></a>'+
   steps+'<button type="button" class="pg-approved-hotspot pg-approved-start" data-step="2" aria-label="Начать урок" style="'+(num===1?'left:12%;top:61.1%;width:74%;height:5.8%':'left:12%;top:66.5%;width:72%;height:6.6%')+'"></button>'+
   '</div><div class="pg-approved-bottom" aria-hidden="true"></div><div class="pg-approved-theme-scene" aria-hidden="true"></div>';
  section.querySelector('img').src=img.src;
  return section;
 }
 function mount(){
  const app=document.querySelector('#app');
  if(!app)return;
  if(app.dataset.view!=='1'){
   app.querySelector('#pg433 .pg433-content')?.classList.remove('pg-approved-active');
   return;
  }
  const content=app.querySelector('#pg433 .pg433-content');
  if(!content||content.querySelector('.pg-approved-overlay')||loading.has(content))return;
  loading.add(content);
  const img=new Image();
  img.onload=()=>{
   loading.delete(content);
   if(app.dataset.view!=='1'||!content.isConnected||app.querySelector('#pg433 .pg433-content')!==content)return;
   content.classList.add('pg-approved-active');
   const cover=build(img);
   content.append(cover);
   // Image existence is verified before any visual override. Existing poster,
   // lesson navigation, audio and progress are untouched if the scene is absent.
   const theme=new Image();
   theme.onload=()=>{
    if(!cover.isConnected)return;
    const area=cover.querySelector('.pg-approved-theme-scene');
    const poster=cover.querySelector('.pg-approved-poster');
    if(!area||!poster)return;
    const position=()=>{area.style.top=(poster.getBoundingClientRect().height*(num===1?.675:.74)).toFixed(2)+'px';};
    area.style.backgroundImage='url("'+thematicArt+'")';
    position();
    area.classList.add('pg-approved-scene-ready');
    if('ResizeObserver' in window)new ResizeObserver(position).observe(poster);
    else window.addEventListener('resize',position,{passive:true});
   };
   theme.onerror=()=>{}; // approved original remains visible
   theme.src=thematicArt;
  };
  img.onerror=()=>{loading.delete(content); /* Keep original cover. */};
  img.src=art;
 }
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;mount();});
 }
 const observer=new MutationObserver(schedule);
 observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();