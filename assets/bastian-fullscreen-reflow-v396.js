/* Panda Go v396 · exact artwork crops rearranged to make BOTH Bastian
   pages portrait-native. Original JPG, face, costumes, Chinese text, clips and
   action handlers stay unchanged; this only rearranges unaltered pixel regions. */
(function(){
'use strict';
const poster=document.getElementById('poster');
const source=document.getElementById('bastian-approved-screen');
if(!poster||!source||poster.classList.contains('bs396-ready'))return;
const img=source.querySelector('img');
const src=img&&img.getAttribute('src');
if(!src)return;
const originalHits=[...source.querySelectorAll('.screen-hotspot')];
const SRC_W=864,SRC_H=1536;
const rects={
 header:{x:105,y:0,w:759,h:174},
 face:{x:0,y:108,w:357,h:438},
 phrases:{x:361,y:177,w:503,h:639},
 grammar:{x:3,y:818,w:445,h:444},
 phonetics:{x:452,y:818,w:410,h:444},
 steps:{x:0,y:1258,w:864,h:186}
};
function crop(name,title){
 const r=rects[name];
 const box=document.createElement('div');
 box.className='bs396-crop bs396-'+name;
 box.style.aspectRatio=r.w+' / '+r.h;
 box.setAttribute('aria-label',title);
 const picture=document.createElement('img');
 picture.src=src;picture.alt='';picture.decoding='async';picture.draggable=false;
 picture.setAttribute('aria-hidden','true');
 picture.style.width=(SRC_W/r.w*100)+'%';
 picture.style.height='auto';
 picture.style.left=(-r.x/r.w*100)+'%';
 picture.style.top=(-r.y/r.h*100)+'%';
 box.appendChild(picture);
 for(const hit of originalHits){
  const x=parseFloat(hit.style.left)*SRC_W/100;
  const y=parseFloat(hit.style.top)*SRC_H/100;
  const width=parseFloat(hit.style.width)*SRC_W/100;
  const height=parseFloat(hit.style.height)*SRC_H/100;
  const cx=x+width/2,cy=y+height/2;
  if(!(cx>=r.x&&cx<=r.x+r.w&&cy>=r.y&&cy<=r.y+r.h))continue;
  // A hotspot remains a real button, in the same original image location.
  const copy=hit.cloneNode(true);
  copy.removeAttribute('id');
  if(hit.id==='start')copy.dataset.stepLink='0';
  copy.style.left=((x-r.x)/r.w*100)+'%';
  copy.style.top=((y-r.y)/r.h*100)+'%';
  copy.style.width=(width/r.w*100)+'%';
  copy.style.height=(height/r.h*100)+'%';
  box.appendChild(copy);
 }
 return box;
}
const pages=[...poster.querySelectorAll('.bs394-page')];
if(pages.length!==2)return;
const first=document.createElement('div');first.className='bs396-layout bs396-first';
first.appendChild(crop('header','Оригинальная шапка Panda Go'));
const hero=document.createElement('div');hero.className='bs396-hero';
hero.appendChild(crop('face','Утверждённое лицо и одежда Бастиана'));
const name=document.createElement('div');name.className='bs396-intro';
name.innerHTML='<strong>Бастиан</strong><span lang="zh-Hans">你好！</span><small>Привет! Давай познакомимся по-китайски.</small>';
hero.appendChild(name);first.appendChild(hero);
first.appendChild(crop('phrases','Четыре фразы Бастиана с настоящими кнопками аудио'));
const second=document.createElement('div');second.className='bs396-layout bs396-second';
second.append(
 crop('grammar','Шесть правил: разбор по шагам'),
 crop('phonetics','Оригинальная фонетика, тоны и аудио'),
 crop('steps','Ход урока и четыре интерактивных этапа')
);
pages[0].appendChild(first);
pages[1].appendChild(second);
poster.classList.add('bs396-ready');
})();
