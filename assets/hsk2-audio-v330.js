/* HSK2 user recordings v331.
   Original Luvvoice file recorded 2026-11-13, B01-B10 in confirmed order.
   Time ranges end in silence; a clip never uses synthetic speech or older speaker clips.
*/
(()=>{'use strict';
const original='./assets/hsk2-user-voice/B01-B10-20261113.mp3';
const rows=[
 ['你学习中文吗',0.00,1.86],
 ['我学习中文',2.25,3.96],
 ['你忙吗',4.26,5.51],
 ['我很忙',5.90,7.10],
 ['我不忙',7.47,8.63],
 ['中文',9.03,10.05],
 ['学习',10.43,11.58],
 ['忙',11.97,12.70],
 ['你为什么学习中文',13.06,15.19],
 ['因为我喜欢中文',15.55,17.93]
];
const normalize=s=>String(s||'').replace(/[。？！!?，,\s]/g,'');
const segments=new Map(rows.map(([zh,start,end])=>[normalize(zh),{url:original,start,end,source:'user-lv-20261113-B01-B10'}]));
const day14='./assets/hsk2-user-voice/20261114-W6Okix.mp3';
const day14Rows=[
 ['你从哪里来',0.08,1.71],
 ['你住在哪儿',2.06,3.51],
 ['你是哪里人',3.85,5.46],
 ['你学习中文吗',5.81,7.63],
 ['你为什么学习中文',8.01,10.14],
 ['你学中文多久了',10.48,12.54],
 ['你喜欢学中文吗',12.91,14.92],
 ['你会说中文吗',15.29,17.11],
 ['你会说一点中文吗',17.47,19.66],
 ['我们继续练习吧',20.02,21.96]
];
// Keep the previously checked B01 clip on duplicate text; use the new file for other questions.
for(const [zh,start,end] of day14Rows){
 const key=normalize(zh);
 if(!segments.has(key))segments.set(key,{url:day14,start,end,source:'user-lv-20261114-W6Okix'});
}
const pandaIntro='./assets/hsk2-user-voice/20261114-APqUx9.mp3';
const pandaIntroRows=[
 ['你好',0.08,1.05],
 ['我叫熊猫',1.43,2.86],
 ['我今年三岁了',3.24,5.10],
 ['我是你的中文学习伙伴',5.49,8.10],
 ['很高兴认识你',8.48,10.35],
 ['我们一起学中文吧',10.73,13.13],
 ['我是熊猫',14.82,16.13],
 ['你叫什么名字',20.68,22.44],
 ['我三岁了',18.15,19.50],
 ['你呢',19.53,20.32],
 ['你今年多大了',22.79,24.57],
 ['你几岁了',24.94,26.39]
];
for(const [zh,start,end] of pandaIntroRows){
 const key=normalize(zh);
 if(!segments.has(key))segments.set(key,{url:pandaIntro,start,end,source:'user-lv-20261114-APqUx9'});
}
// v332: 155 transcribed phrases from the user's other 10 original MP3 files.
// Preserve priority of previously checked B01 / W6 / APq clips on duplicate phrases.
for(const entry of (window.PandaUserVoiceIndexV332?.clips||[])){
 const phrase=normalize(entry.zh);
 if(!phrase||segments.has(phrase))continue;
 if(!(Number.isFinite(entry.start)&&Number.isFinite(entry.end)&&entry.end>entry.start))continue;
 segments.set(phrase,{
  url:'./assets/hsk2-user-voice/'+entry.file,start:entry.start,end:entry.end,
  source:'user-lv-20261114-'+entry.file
 });
}
// Curated ENTIRE audible example sentences, never a fabricated solo-word clip.
// A sample is explicitly labelled «Пример» to avoid misleading learners.
const sampleMap=Object.freeze({"很":"我很忙","我":"我学习中文","你":"你忙吗","他":"他五岁","她":"她一岁","是":"我是熊猫老师","不":"我不忙","吗":"你忙吗","老师":"我是熊猫老师","三":"我有三个朋友","十":"十后面是什么","今天":"你今天怎么样","妈妈":"你妈妈好吗","爸爸":"你爸爸怎么样","年":"我今年三岁了","你学习中文":"你学习中文吗","他学习中文":"我学习中文","你很忙":"你忙吗","他很忙":"我很忙","我不是老师":"不是，我是老师","你是老师吗":"你是学生吗","叫":"我叫熊猫","名字":"你叫什么名字","什么":"你想学什么","住":"我住在中国","在":"我住在中国","住在":"我住在中国","哪儿":"你住在哪儿","做":"你早上做什么","我叫安娜":"我叫熊猫","我是医生":"我是熊猫老师","我住在莫斯科":"我住在中国","的":"我是你的中文学习伙伴","好":"你好","我很好":"我很好，谢谢","朋友":"你有几个朋友","喜欢":"因为我喜欢中文","中国":"我住在中国","我喜欢中文":"因为我喜欢中文","说":"你会说中文吗","读":"你会读中文吗","写":"你会写汉字吗","听":"我晚上听音乐","吃":"你吃饭了吗","喝":"你每天喝水吗","水":"你每天喝水吗","饭":"我中午吃饭","来":"你从哪里来","看":"我下午看书","想":"我想学中文","买":"你想买几个苹果","回":"我回家以后休息"});
function exampleFor(word){
 const sample=sampleMap[normalize(word)];
 return sample&&segments.has(normalize(sample))?sample:null;
}
let active=null;
function stop(){
 const a=active;if(!a)return;
 active=null;a.pause();a.ontimeupdate=null;a.onended=null;a.onerror=null;
}
function lookup(phrase){
 const clip=segments.get(normalize(phrase));
 return clip?.url||null;
}
function play(phrase,report){
 const clip=segments.get(normalize(phrase));
 if(!clip){report?.('Для «'+phrase+'» нет подтверждённого MP3 в присланных записях.');return false}
 stop();
 try{
  // Call play() while the learner's click gesture is still active.
  // Deferring play() until loadedmetadata/seeked can be rejected on Android Chrome.
  const a=new Audio(clip.url);active=a;
  a.preload='auto';a.playbackRate=0.9;
  const fail=()=>{
   if(active===a){stop();report?.('Аудиозапись не воспроизвелась. Проверь загрузку MP3.')}
  };
  const seekToStart=()=>{
   if(active!==a||clip.start<=0.05)return;
   if(Math.abs(a.currentTime-clip.start)<0.20)return;
   try{a.currentTime=clip.start}catch{ /* metadata not yet loaded; retry below */ }
  };
  a.onerror=fail;
  a.onended=()=>{if(active===a){stop();report?.('Запись воспроизведена.')}};
  a.ontimeupdate=()=>{if(active===a&&a.currentTime>=clip.end){stop();report?.('Запись воспроизведена.')}};
  a.onloadedmetadata=seekToStart;
  seekToStart();
  const task=a.play();
  if(task?.catch)task.catch(fail);
  return true;
 }catch{stop();report?.('Ошибка запуска MP3.');return false}
}
function playBest(phrase,report){
 if(lookup(phrase))return play(phrase,report);
 const sample=exampleFor(phrase);
 if(!sample)return play(phrase,report);
 report?.('Слушаем пример «'+sample+'», не отдельное слово «'+phrase+'».');
 return play(sample,report);
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function button(phrase,showMissing=false){
 const exact=!!lookup(phrase);
 if(exact)return '<button class="hsk2-clip" data-hsk2-sound="'+escapeHtml(phrase)+'" type="button">🔊 Слушать</button>';
 const sample=exampleFor(phrase);
 if(sample)return '<button class="hsk2-clip" data-hsk2-sound="'+escapeHtml(sample)+'" data-hsk2-example-for="'+escapeHtml(phrase)+'" title="Пример: '+escapeHtml(sample)+'" type="button">🔊 Пример</button>';
 if(showMissing)return '<span class="hsk2-missing-audio" title="Нет точной записи в присланных MP3">🎧 Нет отдельного MP3</span>';
 return '';
}
function bind(root=document){
 root.querySelectorAll('[data-hsk2-sound]').forEach(el=>{
  if(el.dataset.bound==='1')return;el.dataset.bound='1';
  el.addEventListener('click',()=>{
   const report=m=>{
    const status=root.querySelector('#audio-status')||root.querySelector('.pg-sound-hint')||root.querySelector('.hsk2-clip-status');
    if(status)status.textContent=m;
   };
   if(el.dataset.hsk2ExampleFor)report('Это пример: '+el.dataset.hsk2Sound+'. Отдельного MP3 для '+el.dataset.hsk2ExampleFor+' нет.');
   play(el.dataset.hsk2Sound,report);
  });
 });
}
window.PandaHsk2AudioV331=Object.freeze({lookup,play,playBest,exampleFor,button,bind,normalize,stop,segments:Object.freeze([...segments.keys()])});
window.PandaHsk2AudioV330=window.PandaHsk2AudioV331;
})();
