/* Panda Go HSK1 sequential journey v371.
   New gate record, independent from all historical lesson progress.
   Never erase original learning data, recordings or completed tasks. */
(function(){
 'use strict';
 const KEY='pg-hsk1-path-v371';
 function completed(){
   try{const n=Number(localStorage.getItem(KEY)||0);return Number.isInteger(n)?Math.min(7,Math.max(0,n)):0}catch{return 0}
 }
 function markComplete(n){
   n=Number(n);
   if(!Number.isInteger(n)||n<1||n>7)return false;
   const current=completed();
   if(n===current+1){
     try{localStorage.setItem(KEY,String(n))}catch{return false}
     return true;
   }
   return n<=current;
 }
 window.PandaGoPathV371=Object.freeze({key:KEY,completed,markComplete,canOpen:n=>Number(n)<=Math.min(7,completed()+1)});
 // Existing students keep their original completed work. When they revisit a
 // previously finished lesson in sequential order, honour that achievement
 // without unlocking skipped lessons or resetting saved exercises.
 function acknowledgeHistoricalCompletion(){
   const name=(location.pathname||'').split('/').pop();
   const lessonByPage={
     'hsk1-first-v189.html':1,'hsk1-second-v203.html':2,
     'hsk1-third-v212.html':3,'hsk1-fourth-v214.html':4,
     'hsk1-fifth-v227.html':5,'hsk1-family-v231.html':6,
     'hsk1-weather-v231.html':7
   };
   const n=lessonByPage[name];
   if(!n||n!==completed()+1)return;
   const ids=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
   try{
     const history=JSON.parse(localStorage.getItem('pg-hsk1-v3-complete')||'[]');
     if(Array.isArray(history)&&history.includes(ids[n-1]))markComplete(n);
   }catch{}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',acknowledgeHistoricalCompletion,{once:true});
 else acknowledgeHistoricalCompletion();
})();
