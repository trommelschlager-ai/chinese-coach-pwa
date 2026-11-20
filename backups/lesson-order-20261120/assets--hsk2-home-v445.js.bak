/* Panda Go HSK2 v445: exact approved artwork and genuine tap zones.
 * Activates ONLY after the verified artwork exists in /assets.
 * Never replaces the existing lesson engine, audio, Panda AI or student progress. */
(function(){
'use strict';
const imagePath='./assets/hsk2-home-v445.webp';
const image=new Image();
let available=false;
function hotspot(tag,name,cls,attrs){
  const el=document.createElement(tag);
  el.className='pg445-hotspot '+cls;
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
  el.setAttribute('aria-label',name);
  return el;
}
function sync(){
 if(!available)return;
 const art=document.querySelector('#app.approved-welcome-v390 .approved-welcome-screen .approved-art');
 if(!art)return;
 const img=art.querySelector('img');
 if(!img)return;
 if(img.getAttribute('src')!==imagePath){img.setAttribute('src',imagePath);img.width=941;img.height=1602;img.alt='Panda Go, курс HSK 2. 10 тем, 30 мини-уроков, 200+ слов. Все Уроки, Слова, Грамматика, Практика, Panda AI, Диалоги, Аудио, Мини-тесты, Начать.';}
 art.classList.add('pg445-enabled');
 if(art.querySelector('.pg445-hotspot'))return;
 const controls=[
  ['button','Вернуться к карте HSK 2','pg445-back',{'type':'button','data-view':'map'}],
  ['button','Все уроки и темы курса','pg445-lessons',{'type':'button','data-view':'map'}],
  ['button','Слова: первый этап урока','pg445-words',{'type':'button','data-v445-stage':'0'}],
  ['button','Грамматика: второй этап урока','pg445-grammar',{'type':'button','data-v445-stage':'1'}],
  ['button','Практика произношения','pg445-practice',{'type':'button','data-v445-stage':'2'}],
  ['a','Поговорить с Panda AI','pg445-ai',{'href':'./panda-voice-pilot.html'}],
  ['button','Посмотреть программу курса','pg445-program',{'type':'button','data-view':'map'}],
  ['button','Начать первый урок','pg445-start',{'type':'button','data-start':'0'}],
  ['button','Диалоги из первого урока','pg445-dialogues',{'type':'button','data-v445-stage':'4'}],
  ['button','Аудио и китайские тоны','pg445-audio',{'type':'button','data-view':'tones'}],
  ['button','Мини-тесты первого урока','pg445-tests',{'type':'button','data-v445-stage':'3'}]
 ];
 for(const [tag,name,cls,attrs] of controls)art.appendChild(hotspot(tag,name,cls,attrs));
}
function start(){
 const screen=document.getElementById('screen');
 if(!screen)return;
 const observer=new MutationObserver(sync);
 observer.observe(screen,{subtree:true,childList:true});
 sync();
}
image.onload=function(){if(image.naturalWidth!==941||image.naturalHeight!==1602)return;available=true;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()};
image.onerror=function(){/* The original approved welcome remains completely intact. */};
image.src=imagePath;
})();