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
 const tactileFix=[2,3,6,9].includes(num);
 const art='./assets/hsk2-approved-covers/lesson-'+String(num).padStart(2,'0')+'.png'+(num===1?'?v=20261123back1':'');
 const fullArt='./assets/hsk2-approved-covers/lesson-'+String(num).padStart(2,'0')+'-full.webp';
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const loading=new WeakSet();
 function build(img,full){
  // Reference example is one full-height 843×1866 poster (not a contact sheet,
  // old 941×1672 cover with overlay, or a separate footer image).
  const rows=full?[41.6,48.7]:(num===1?[45.3,52.7]:[46.5,54.5]);
  const cols=full?[5.1,35.9,66.5]:[4.6,35.6,66.6];
  const steps=rows.map((y,row)=>cols.map((x,col)=>{
   const step=row*3+col+2;
   const height=full?'6.9':(num===1?(row===0?'7.25':'7.9'):'7.8');
   return '<button type="button" class="pg-approved-hotspot" data-step="'+step+'" aria-label="'+esc(labels[step-2])+'" style="left:'+x+'%;top:'+y+'%;width:'+(full?'28':'28.9')+'%;height:'+height+'%"></button>';
  }).join('')).join('');
  const section=document.createElement('section');
  section.className='pg-approved-overlay pg-approved-lesson-'+num+(full?' pg-approved-full':'');
  section.setAttribute('aria-label','HSK 2. Урок '+num+'. '+names[num-1]);
  const size=full?['843','1866']:['941','1672'];
  const start=full?(tactileFix?'left:2.3%;top:60.0%;width:95.4%;height:7.7%':'left:2.4%;top:62.0%;width:95.2%;height:7.1%'):(num===1?'left:12%;top:61.1%;width:74%;height:5.8%':'left:12%;top:66.5%;width:72%;height:6.6%');
  section.innerHTML='<div class="pg-approved-poster">'+
   '<img class="pg-approved-cover-image" width="'+size[0]+'" height="'+size[1]+'" draggable="false" decoding="async" alt="HSK 2. Урок '+num+'. '+esc(names[num-1])+'">'+
   (full?'<img class="pg-approved-cta-art" width="'+size[0]+'" height="'+size[1]+'" draggable="false" decoding="async" aria-hidden="true" alt="">':'')+
   '<a class="pg-approved-hotspot pg-approved-map-link" href="./hsk2-life-course.html?view=map" aria-label="Все уроки HSK 2"></a>'+
   steps+'<button type="button" class="pg-approved-hotspot pg-approved-start" data-step="2" aria-label="Начать урок" style="'+start+'"></button>'+
   '</div>'+(full?'':'<div class="pg-approved-bottom" aria-hidden="true"></div>');
  const poster=section.querySelector('.pg-approved-poster');
  const cover=section.querySelector('.pg-approved-cover-image');
  cover.src=img.src;
  if(full){
   // The CTA is baked into the approved poster. Cut it OUT of the base layer
   // and show those exact same pixels in ONE movable layer from the beginning.
   // The base and CTA never both render the button, even during a long press.
   const supportsMask=!!(window.CSS && (
    CSS.supports('mask-image','linear-gradient(black,black)') ||
    CSS.supports('-webkit-mask-image','linear-gradient(black,black)')
   ));
   if(supportsMask){
    const b=tactileFix?{x:23,y:600,w:954,h:77}:{x:24,y:620,w:952,h:71};
    const x2=b.x+b.w,y2=b.y+b.h,rx=80,ry=b.h/2;
    const hole='M'+(b.x+rx)+' '+b.y+' H'+(x2-rx)+
      ' A'+rx+' '+ry+' 0 0 1 '+x2+' '+(b.y+ry)+
      ' V'+(y2-ry)+' A'+rx+' '+ry+' 0 0 1 '+(x2-rx)+' '+y2+
      ' H'+(b.x+rx)+' A'+rx+' '+ry+' 0 0 1 '+b.x+' '+(y2-ry)+
      ' V'+(b.y+ry)+' A'+rx+' '+ry+' 0 0 1 '+(b.x+rx)+' '+b.y+' Z';
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"><path fill="#fff" fill-rule="evenodd" d="M0 0H1000V1000H0Z '+hole+'"/></svg>';
    const mask='url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
    cover.style.maskImage=mask;
    cover.style.webkitMaskImage=mask;
    cover.style.maskSize='100% 100%';
    cover.style.webkitMaskSize='100% 100%';
    const cta=section.querySelector('.pg-approved-cta-art');
    cta.src=img.src;
    cta.style.clipPath='inset('+(b.y/10)+'% '+((1000-x2)/10)+'% '+((1000-y2)/10)+'% '+(b.x/10)+'% round 999px)';
    section.classList.add('pg-approved-cutout-ready');
   }

   // Give the painted Start CTA a real pressed state before changing lessons.
   // The lesson's existing delegated data-step handler still owns navigation.
   const startButton=section.querySelector('.pg-approved-start');
   let pressPending=false;
   let forwardClick=false;
   // The single painted button moves with the pointer; never swap artwork.
   const showPressed=pressed=>{
    startButton.classList.toggle('pg-approved-start-pressed',pressed);
    poster.classList.toggle('pg-approved-pressing',pressed);
   };
   startButton.addEventListener('pointerdown',()=>showPressed(true),{passive:true});
   startButton.addEventListener('pointercancel',()=>{if(!pressPending)showPressed(false);},{passive:true});
   startButton.addEventListener('pointerleave',()=>{if(!pressPending)showPressed(false);},{passive:true});
   startButton.addEventListener('click',event=>{
    if(forwardClick){forwardClick=false;return;}
    event.preventDefault();
    event.stopPropagation();
    if(pressPending)return; // no double navigation from repeated taps
    pressPending=true;
    showPressed(true);
    startButton.setAttribute('aria-busy','true');
    window.setTimeout(()=>{
     showPressed(false);
     startButton.removeAttribute('aria-busy');
     pressPending=false;
     if(!startButton.isConnected)return;
     forwardClick=true;
     startButton.click(); // forwards once to the original app data-step listener
     forwardClick=false;
    },500);
   });
  }
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
  const show=(img,full)=>{
   loading.delete(content);
   if(app.dataset.view!=='1'||!content.isConnected||app.querySelector('#pg433 .pg433-content')!==content)return;
   content.classList.add('pg-approved-active');
   content.append(build(img,full));
  };
  // Prefer one complete, 694:1536 portrait cover. If not installed yet,
  // retain the original working approved cover; no hybrid image blending.
  const img=new Image();
  img.onload=()=>show(img,true);
  img.onerror=()=>{
   const original=new Image();
   original.onload=()=>show(original,false);
   original.onerror=()=>loading.delete(content);
   original.src=art;
  };
  img.src=fullArt;
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