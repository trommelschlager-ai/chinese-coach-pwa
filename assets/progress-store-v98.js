/* Shared by the game and the versioned progress export. Old local keys stay valid. */
(()=>{
 'use strict';
 const key='chinese-coach-game-v76';
 function normalizeGame(value,strict=false){
  const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  if(strict&&v!==value)throw Error('Неверные игровые достижения');
  const integer=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  const out={completed:0,points:0,streak:0,lastDay:'',best:{}};
  for(const [field,max] of [['completed',10000000],['points',1000000000],['streak',10000000]]){
   if(v[field]!==undefined&&!integer(v[field],max)){if(strict)throw Error('Неверное поле достижений: '+field);}
   else out[field]=v[field]||0;
  }
  if(typeof v.lastDay==='string'&&(!v.lastDay||/^\d{4}-\d{2}-\d{2}$/.test(v.lastDay)&&!Number.isNaN(Date.parse(v.lastDay+'T12:00:00Z'))))out.lastDay=v.lastDay;
  else if(strict&&v.lastDay!==undefined)throw Error('Неверная дата достижений');
  if(v.best!==undefined&&(typeof v.best!=='object'||v.best===null||Array.isArray(v.best))){if(strict)throw Error('Неверные лучшие результаты');}
  for(const mode of ['build','choose','listen']){
   const n=v.best?.[mode];if(n===undefined)continue;
   if(integer(n,10))out.best[mode]=n;else if(strict)throw Error('Неверный результат игры');
  }
  return out;
 }
 function readGame(){try{return normalizeGame(JSON.parse(localStorage.getItem(key)||'{}'));}catch{return normalizeGame({});}}
 function writeGame(value){const normalized=normalizeGame(value,true);localStorage.setItem(key,JSON.stringify(normalized));window.dispatchEvent(new Event('game-progress-restored'));return normalized;}
 window.courseProgress={gameKey:key,normalizeGame,readGame,writeGame};
})();
