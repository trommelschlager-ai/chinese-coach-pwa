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
 const fullArt=num===5?'./assets/hsk2-approved-covers/lesson-05-full-softshadow-v7.png':'./assets/hsk2-approved-covers/lesson-'+String(num).padStart(2,'0')+'-full.webp';
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const loading=new WeakSet();

 // Vertical bounds of the painted gold rim on each 843 × 1866 full poster.
 // Coordinates are artwork pixels. The surrounding tiles stay outside the press band.
 const startRims=[
  [1114,1244],[1093,1221],[1097,1227],[1108,1236],[1133,1264],
  [1083,1214],[1117,1252],[1114,1247],[1092,1222],[1110,1244]
 ];
 const [rimTop,rimBottom]=startRims[num-1];
 function preparePress(poster,cover,img){
  const w=img.naturalWidth,h=img.naturalHeight;
  if(w!==843||h!==1866)return ()=>{};
  const frame=document.createElement('canvas');
  const ctx=frame.getContext('2d');
  if(!ctx)return ()=>{};
  const top=rimTop-11,bottom=rimBottom+24;
  frame.width=w;
  frame.height=bottom-top;
  frame.className='pg-approved-press-frame';
  frame.setAttribute('aria-hidden','true');
  cover.after(frame);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation=0;
  function draw(offset,brightness){
   const band=(from,to,start,end)=>{
    ctx.drawImage(img,0,from,w,to-from,0,start-top,w,end-start);
   };
   band(top,rimTop,top,rimTop+offset);
   ctx.filter='brightness('+brightness+')';
   band(rimTop,rimBottom,rimTop+offset,rimBottom+offset);
   ctx.filter='none';
   band(rimBottom,bottom,rimBottom+offset,bottom);
  }
  return pressed=>{
   cancelAnimationFrame(animation);
   if(!pressed){
    poster.classList.remove('pg-approved-frame-visible');
    return;
   }
   const {width,height}=cover.getBoundingClientRect();
   const scale=Math.max(width/w,height/h);
   if(!scale)return;
   // Match the cover's centered object-fit: cover crop exactly.
   frame.style.left=(width-w*scale)/2+'px';
   frame.style.top=(height-h*scale)/2+top*scale+'px';
   frame.style.width=w*scale+'px';
   frame.style.height=(bottom-top)*scale+'px';
   const offset=3/scale;
   const start=performance.now();
   function tick(now){
    const progress=Math.min(1,Math.max(0,(now-start)/100));
    const eased=1-(1-progress)**2;
    draw(reducedMotion.matches?0:Math.round(offset*eased),1-.025*eased);
    poster.classList.add('pg-approved-frame-visible');
    if(progress<1)animation=requestAnimationFrame(tick);
   }
   animation=requestAnimationFrame(tick);
  };
 }
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
  const start=full?('left:1.3%;top:'+(rimTop/18.66)+'%;width:97.4%;height:'+((rimBottom-rimTop)/18.66)+'%'):(num===1?'left:12%;top:61.1%;width:74%;height:5.8%':'left:12%;top:66.5%;width:72%;height:6.6%');
  section.innerHTML='<div class="pg-approved-poster">'+
   '<img class="pg-approved-cover-image" width="'+size[0]+'" height="'+size[1]+'" draggable="false" decoding="async" alt="HSK 2. Урок '+num+'. '+esc(names[num-1])+'">'+

   '<a class="pg-approved-hotspot pg-approved-map-link" href="./hsk2-life-course.html?view=map" aria-label="Все уроки HSK 2"></a>'+
   steps+'<button type="button" class="pg-approved-hotspot pg-approved-start" data-step="2" aria-label="Начать урок" style="'+start+'"></button>'+
   '</div>'+(full?'':'<div class="pg-approved-bottom" aria-hidden="true"></div>');
  const poster=section.querySelector('.pg-approved-poster');
  const cover=section.querySelector('.pg-approved-cover-image');
  cover.src=img.src;
  if(full){
   const renderPress=preparePress(poster,cover,img);

   // Give the painted Start CTA a real pressed state before changing lessons.
   // The lesson's existing delegated data-step handler still owns navigation.
   const startButton=section.querySelector('.pg-approved-start');
   let pressPending=false;
   let forwardClick=false;
   // The single painted button moves with the pointer; never swap artwork.
   let showingPressed=false;
   const showPressed=pressed=>{
    if(showingPressed===pressed)return;
    showingPressed=pressed;
    renderPress(pressed);
   };
   startButton.addEventListener('pointerdown',()=>showPressed(true),{passive:true});
   startButton.addEventListener('pointercancel',()=>{if(!pressPending)showPressed(false);},{passive:true});
   startButton.addEventListener('pointerup',()=>{
    requestAnimationFrame(()=>{if(!pressPending)showPressed(false);});
   },{passive:true});
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