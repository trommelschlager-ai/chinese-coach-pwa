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

 // Detect the purple CTA's vertical position from EACH approved cover.
 // Individual posters have different CTA heights: a shared y=60% hotspot is wrong.
 function findStartRect(img){
  const fallback={x:.013,y:([2,3,6].includes(num)?.587:num===9?.600:.608),w:.974,h:.112};
  try{
   const scan=document.createElement('canvas');
   scan.width=220;scan.height=480;
   const context=scan.getContext('2d',{willReadFrequently:true});
   if(!context)return fallback;
   context.drawImage(img,0,0,scan.width,scan.height);
   const data=context.getImageData(0,0,scan.width,scan.height).data;
   const h=scan.height,w=scan.width,scores=new Float32Array(h);
   for(let y=Math.round(h*.54);y<Math.round(h*.78);y++){
    let matched=0,total=0;
    for(const range of [[.12,.32],[.68,.88]]){
     for(let x=Math.round(w*range[0]);x<Math.round(w*range[1]);x+=2){
      const p=(y*w+x)*4,r=data[p],g=data[p+1],b=data[p+2];
      if(r<210&&g<100&&b>100&&b>g*1.4)matched++;
      total++;
     }
    }
    scores[y]=matched/total;
   }
   const span=Math.round(h*.05),half=Math.floor(span/2);
   let best=0,at=-1;
   for(let cy=Math.round(h*.575);cy<Math.round(h*.745);cy++){
    let sum=0;
    for(let y=cy-half;y<cy-half+span;y++)sum+=scores[y];
    const score=sum/span;
    if(score>best){best=score;at=cy;}
   }
   if(best<.47||at<0)return fallback;
   // Include the original GOLD RIM and shadow, not just text / purple interior.
   return {x:.013,y:Math.max(.54,at/h-.062),w:.974,h:.112};
  }catch(_e){return fallback;}
 }
 // Render the ORIGINAL pixels as a movable button, never a replacement graphic.
 // The base is softly blurred UNDER the pill, preventing an exposed duplicate.
 // Canvas uses the same natural dimensions and object-fit as the approved cover.
 function preparePressedArtwork(section,poster,img,rect){
  try{
   const w=img.naturalWidth,h=img.naturalHeight;
   if(!w||!h)return;
   const left=rect.x*w,top=rect.y*h,bw=rect.w*w,bh=rect.h*h;
   const make=kind=>{
    const node=document.createElement('canvas');
    node.width=w;node.height=h;
    node.className='pg-approved-'+kind+'-canvas';
    node.setAttribute('aria-hidden','true');
    return node;
   };
   const base=make('base'),button=make('button');
   const bg=base.getContext('2d'),fg=button.getContext('2d');
   if(!bg||!fg)return;
   bg.drawImage(img,0,0,w,h);
   bg.save();
   bg.beginPath();
   bg.roundRect(left,top,bw,bh,bh/2);
   bg.clip();
   // The temporary recess is visible only while the button is 4px lower.
   if('filter' in bg)bg.filter='blur(42px)';
   else {bg.fillStyle='#74219e';bg.fillRect(left,top,bw,bh);}
   if('filter' in bg)bg.drawImage(img,0,0,w,h);
   bg.restore();
   fg.save();
   fg.beginPath();
   fg.roundRect(left,top,bw,bh,bh/2);
   fg.clip();
   fg.drawImage(img,0,0,w,h);
   fg.restore();
   const cover=section.querySelector('.pg-approved-cover-image');
   cover.after(base,button);
   section.classList.add('pg-approved-canvas-ready');
  }catch(_e){/* Keep the original intact if canvas is unavailable. */}
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
  const rect=full?findStartRect(img):null;
  const start=full?('left:'+(rect.x*100).toFixed(2)+'%;top:'+(rect.y*100).toFixed(2)+'%;width:'+(rect.w*100).toFixed(2)+'%;height:'+(rect.h*100).toFixed(2)+'%'):(num===1?'left:12%;top:61.1%;width:74%;height:5.8%':'left:12%;top:66.5%;width:72%;height:6.6%');
  section.innerHTML='<div class="pg-approved-poster">'+
   '<img class="pg-approved-cover-image" width="'+size[0]+'" height="'+size[1]+'" draggable="false" decoding="async" alt="HSK 2. Урок '+num+'. '+esc(names[num-1])+'">'+

   '<a class="pg-approved-hotspot pg-approved-map-link" href="./hsk2-life-course.html?view=map" aria-label="Все уроки HSK 2"></a>'+
   steps+'<button type="button" class="pg-approved-hotspot pg-approved-start" data-step="2" aria-label="Начать урок" style="'+start+'"></button>'+
   '</div>'+(full?'':'<div class="pg-approved-bottom" aria-hidden="true"></div>');
  const poster=section.querySelector('.pg-approved-poster');
  const cover=section.querySelector('.pg-approved-cover-image');
  cover.src=img.src;
  if(full){
   preparePressedArtwork(section,poster,img,rect);

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