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
})();
