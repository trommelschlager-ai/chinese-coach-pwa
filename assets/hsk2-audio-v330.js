/* HSK2 user recordings v334: exact audio matching only.
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
// v338: 73 exact original Luvvoice utterances from three user-provided recordings.
// 30 + 25 single words and 18 standalone sentences; indexed against measured silences.
// v338 supersedes old sentence-only examples for exact matches; no synthetic speech.
const approvedV338=[{"group":"words_a","file":"20261114-words-a-v338.mp3","zh":"我|你|他|她|是|不|吗|老师|三|十|今天|星期|妈妈|爸爸|天气|下雨|年|月|日|号|叫|名字|什么|住|在|哪儿|莫斯科|工作|做|医生","times":"0.19-0.79,1.31-1.91,2.45-3.05,3.59-4.19,4.73-5.43,5.99-6.57,7.13-7.75,8.31-9.23,9.79-10.49,11.05-11.81,12.35-13.27,13.83-14.79,15.35-16.19,16.75-17.59,18.15-19.11,19.67-20.61,21.13-21.77,22.33-22.97,23.53-24.15,24.73-25.33,25.89-26.51,27.07-27.95,28.49-29.33,29.89-30.49,31.05-31.69,32.21-32.83,33.35-34.47,35.03-35.89,36.45-37.09,37.67-38.55"},{"group":"words_b","file":"20261114-words-b-v338.mp3","zh":"的|好|很|爱|朋友|喜欢|中国|说|读|写|听|吃|喝|茶|水|饭|饭店|公司|去|来|看|想|买|回|点","times":"0.21-0.83,1.37-1.99,2.53-3.19,3.71-4.37,4.93-5.79,6.35-7.31,7.87-8.77,9.31-10.03,10.59-11.21,11.75-12.47,13.03-13.67,14.21-14.87,15.43-16.09,16.63-17.29,17.83-18.55,19.11-19.79,20.35-21.25,21.81-22.71,23.25-23.95,24.49-25.13,25.69-26.31,26.87-27.59,28.13-28.75,29.29-29.93,30.49-31.13"},{"group":"phrases","file":"20261114-phrases-v338.mp3","zh":"我不是老师。|你是老师吗？|今天下雨。|你学习中文。|他学习中文。|你很忙。|他很忙。|我很好。|我不在家。|我喜欢中文。|我爱中国。|我听老师说中文。|我喝茶。|我想吃饭。|我在公司工作。|我去饭店。|我八点回家。|你几点来？","times":"0.19-1.69,2.21-3.59,4.15-5.53,6.03-7.53,8.07-9.61,10.13-11.17,11.73-12.77,13.33-14.39,14.95-16.17,16.71-18.23,18.77-20.11,20.65-22.63,23.15-24.27,24.83-26.11,26.67-28.33,28.87-30.15,30.71-32.17,32.69-33.93"}];
for(const pack of approvedV338){
 const wordList=pack.zh.split('|'),boundaries=pack.times.split(',');
 if(wordList.length!==boundaries.length)throw Error('HSK2 v338 audio index mismatch: '+pack.group);
 for(let i=0;i<wordList.length;i++){
  const [start,end]=boundaries[i].split('-').map(Number);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
  segments.set(normalize(wordList[i]),{url:'./assets/hsk2-user-voice/'+pack.file,start,end,source:'user-lv-v338-'+pack.group});
 }
}
// v342: complete user-supplied Luvvoice audio for the HSK2 question about work.
segments.set(normalize('你做什么工作'),{url:'./assets/hsk2-user-voice/20261114-job-question-v342.mp3',start:0.20,end:1.72,source:'user-lv-20261114-job-question'});
// v335: opt-in COMPLETE sentence examples under otherwise silent single-word cards.
// A recording may be played only next to that same visible full Chinese sentence.
// Never use these mappings as a fallback for play(word) or button(word).
const wordSentences=Object.freeze({
 '我':['我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский.'],
 '叫':['我叫熊猫。','Wǒ jiào Xióngmāo.','Меня зовут Панда.'],
 '名字':['你叫什么名字？','Nǐ jiào shénme míngzi?','Как тебя зовут?'],
 '什么':['你想学什么？','Nǐ xiǎng xué shénme?','Что ты хочешь изучать?'],
 '住':['我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.'],
 '住在':['我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.'],
 '哪儿':['你住在哪儿？','Nǐ zhù zài nǎr?','Где ты живёшь?'],
 '做':['你早上做什么？','Nǐ zǎoshang zuò shénme?','Что ты делаешь утром?'],
 '老师':['我是熊猫老师。','Wǒ shì Xióngmāo lǎoshī.','Я учитель Панда.'],
 '不':['我不忙。','Wǒ bù máng.','Я не занят.'],
 '的':['我是你的中文学习伙伴。','Wǒ shì nǐ de Zhōngwén xuéxí huǒbàn.','Я твой помощник в изучении китайского.'],
 '好':['你好！','Nǐ hǎo!','Привет!'],
 '很':['我很忙。','Wǒ hěn máng.','Я занят.'],
 '在':['我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.'],
 '朋友':['我有三个朋友。','Wǒ yǒu sān ge péngyou.','У меня три друга.'],
 '喜欢':['因为我喜欢中文。','Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский.'],
 '中国':['我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.'],
 '说':['你会说中文吗？','Nǐ huì shuō Zhōngwén ma?','Ты умеешь говорить по-китайски?'],
 '读':['你会读中文吗？','Nǐ huì dú Zhōngwén ma?','Ты умеешь читать по-китайски?'],
 '写':['你会写汉字吗？','Nǐ huì xiě Hànzì ma?','Ты умеешь писать иероглифы?'],
 '听':['我晚上听音乐。','Wǒ wǎnshang tīng yīnyuè.','Вечером я слушаю музыку.'],
 '吃':['我中午吃饭。','Wǒ zhōngwǔ chī fàn.','Я обедаю.'],
 '喝':['你每天喝水吗？','Nǐ měitiān hē shuǐ ma?','Ты каждый день пьёшь воду?'],
 '水':['你每天喝水吗？','Nǐ měitiān hē shuǐ ma?','Ты каждый день пьёшь воду?'],
 '饭':['我中午吃饭。','Wǒ zhōngwǔ chī fàn.','Я обедаю.'],
 '来':['你从哪里来？','Nǐ cóng nǎlǐ lái?','Откуда ты приехал?'],
 '看':['我下午看书。','Wǒ xiàwǔ kàn shū.','Днём я читаю книгу.'],
 '想':['我想学中文。','Wǒ xiǎng xué Zhōngwén.','Я хочу изучать китайский.'],
 '买':['我想买两个苹果。','Wǒ xiǎng mǎi liǎng ge píngguǒ.','Я хочу купить два яблока.'],
 '回':['我回家以后休息。','Wǒ huí jiā yǐhòu xiūxi.','Я отдыхаю после возвращения домой.']
});
function sentenceFor(word){
 const entry=wordSentences[normalize(word)];
 if(!entry||!segments.has(normalize(entry[0])))return null;
 return {zh:entry[0],pinyin:entry[1],ru:entry[2]};
}
function exampleFor(){return null}
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
  // Android: start play() in the click handler, but keep the source muted
  // until the seek reaches the correct sentence. Never expose the previous sentence.
  const a=new Audio(clip.url);active=a;
  a.preload='auto';a.playbackRate=.9;
  let ready=clip.start<=0.05;
  a.muted=!ready;
  const fail=()=>{if(active===a){stop();report?.('MP3 не воспроизвёлся. Проверь интернет и попробуй ещё раз.')}};
  const checkSeek=()=>{
   if(active!==a||ready||!Number.isFinite(a.currentTime))return;
   if(Math.abs(a.currentTime-clip.start)<=.17){
    ready=true;a.muted=false;
   }
  };
  const seekToStart=()=>{
   if(active!==a||ready||a.readyState<1)return;
   try{a.currentTime=clip.start}catch{}
  };
  a.onerror=fail;
  a.onloadedmetadata=seekToStart;
  a.onseeked=checkSeek;
  a.onended=()=>{if(active===a){stop();report?.('Запись воспроизведена.')}};
  a.ontimeupdate=()=>{
   if(active!==a)return;
   if(!ready){if(a.readyState>=1)seekToStart();checkSeek();return}
   if(a.currentTime>=clip.end){stop();report?.('Запись воспроизведена.')}
  };
  seekToStart();
  const task=a.play(); // Directly within user gesture.
  if(task?.catch)task.catch(fail);
  return true;
 }catch{stop();report?.('Ошибка запуска MP3.');return false}
}
function playBest(phrase,report){
 // Compatibility alias: never use a sentence as a fallback for a word.
 return play(phrase,report);
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function button(phrase,showMissing=false){
 const exact=!!lookup(phrase);
 if(exact)return '<button class="hsk2-clip" data-hsk2-sound="'+escapeHtml(phrase)+'" type="button" aria-label="Слушать: '+escapeHtml(phrase)+'">🔊 Слушать</button>';
 return showMissing?'<span class="hsk2-missing-audio" aria-label="Нет отдельной аудиозаписи для '+escapeHtml(phrase)+'">🔇 Нет отдельного MP3</span>':'';
}
function bind(root=document){
 root.querySelectorAll('[data-hsk2-sound]').forEach(el=>{
  if(el.dataset.bound==='1')return;el.dataset.bound='1';
  el.addEventListener('click',()=>{
   const report=m=>{
    const status=root.querySelector('#audio-status')||root.querySelector('.pg-sound-hint')||root.querySelector('.hsk2-clip-status');
    if(status)status.textContent=m;
   };

   play(el.dataset.hsk2Sound,report);
  });
 });
}
window.PandaHsk2AudioV331=Object.freeze({lookup,play,playBest,exampleFor,sentenceFor,button,bind,normalize,stop,segments:Object.freeze([...segments.keys()])});
window.PandaHsk2AudioV330=window.PandaHsk2AudioV331;
})();
