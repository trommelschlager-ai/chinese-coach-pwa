/* Panda Go HSK2 · 17 Nov 2026 · approved image-exact welcome & lesson-1 cover.
   Only two entry screens change; the existing 5-stage course, audio and Panda AI are preserved. */
(function(){
'use strict';
const homeImage='./assets/hsk2-approved-20261117/home.jpg',lessonImage='./assets/hsk2-approved-20261117/lesson1.jpg';
const original=window.PandaGoDayFirstUIV1;
if(original){
 window.PandaGoDayFirstUIV1={
  ...original,
  makeState(mini){
   const day=original.makeState(mini);
   if(Number(mini)===0)day.pgApprovedCover=true;
   return day;
  },
  render(state,ctx){
   if(state.topic===0&&state.mini===0&&state.stage===0&&state.day?.pgApprovedCover){
    return '<section class="pg432-cover day-visual-start approved-stage" aria-label="HSK 2 · Урок 1 · Мой день">'+
     '<div class="pg432-cover-art">'+
       '<img src="'+lessonImage+'" alt="HSK 2 · Урок 1. Мой день. Панда с календарём. 起床 qǐchuáng — вставать; 吃早饭 chī zǎofàn — завтракать; 睡觉 shuìjiào — спать. Кнопка Начать урок." width="864" height="1536" draggable="false" fetchpriority="high">'+
       '<button type="button" class="pg432-hit pg432-cover-back" data-pg432-cover-back aria-label="На главную HSK 2"></button>'+
       '<button type="button" class="pg432-hit pg432-cover-start" data-pg432-cover-start aria-label="Начать первый урок: слова, грамматика, практика, тесты"></button>'+
     '</div></section>';
   }
   return original.render(state,ctx);
  },
  handle(button,state,api){
   if(button.dataset.pg432CoverStart!==undefined){
    state.day.pgApprovedCover=false;
    api.render();return true;
   }
   if(button.dataset.pg432CoverBack!==undefined){
    api.go('welcome');return true;
   }
   // The first Back tap from vocabulary returns to the approved lesson cover.
   if(button.dataset.dayPrev!==undefined&&state.mini===0&&state.stage===0
      &&state.topic===0&&state.day&&!state.day.pgApprovedCover){
    state.day.pgApprovedCover=true;api.render();return true;
   }
   return original.handle(button,state,api);
  }
 };
}
function syncHome(){
 const art=document.querySelector('#app.approved-welcome-v390 .approved-welcome-screen .approved-art');
 if(!art)return;
 const img=art.querySelector('img');
 if(img&&!img.dataset.pg432Approved){
  img.src=homeImage;img.width=864;img.height=1536;
  img.alt='Panda Go · Китайский HSK 2. Панда читает китайскую книгу. 10 тем, 30 мини-уроков и 200+ слов и фраз. Первый урок Мой день. Посмотреть программу курса или начать уровень 2.';
  img.dataset.pg432Approved='true';
 }
 if(!art.querySelector('.pg432-first-card')){
  const card=document.createElement('button');
  card.type='button';card.className='pg432-hit pg432-first-card';
  card.dataset.start='0';card.setAttribute('aria-label','Открыть урок 1 — Мой день');
  art.appendChild(card);
 }
 if(!art.querySelector('.pg432-back-home')){
  const back=document.createElement('button');
  back.type='button';back.className='pg432-hit pg432-back-home';
  back.dataset.view='map';back.setAttribute('aria-label','Назад к программе HSK 2');
  art.appendChild(back);
 }
}
function start(){
 const screen=document.getElementById('screen');
 if(!screen)return;
 const observer=new MutationObserver(syncHome);
 observer.observe(screen,{childList:true,subtree:true});
 syncHome();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();