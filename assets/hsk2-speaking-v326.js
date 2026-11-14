/* Panda Go HSK2 v326. Two speech practice modes:
   3 fixed attempts for early exercises, 5 fixed attempts for final 4-word review.
   Word transcription is NOT acoustic evaluation of Mandarin tones. */
(()=>{'use strict';
const W=window;
const e=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const normalize=x=>String(x??'').normalize('NFKC').replace(/[，。！？、,.!?;；：:\s"'“”‘’()\[\]{}\-—·]/g,'');
const match=(spoken,targets)=>!!normalize(spoken)&&targets.some(x=>normalize(spoken)===normalize(x));
const StoragePrefix='pg-hsk2-speaking-v326:';
const memory={};
function load(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{memory[k]=v}}
function SR(){return W.SpeechRecognition||W.webkitSpeechRecognition}
const speechAvailable=()=>!!SR();
const clipMap={'很':'./assets/owner-clean-v237/2ddeccad2b8bf7e6.mp3'};
let audio=null;
function play(zh,report=()=>{}){
 const src=clipMap[zh];
 if(!src){report('Для «'+zh+'» пока нет проверенной MP3-записи. Другой голос не включаем.');return false}
 try{audio?.pause();audio=new Audio(src);audio.preservesPitch=true;audio.playbackRate=.9;
 audio.onerror=()=>report('MP3 не загрузился.');audio.play()?.catch?.(()=>report('Не удалось воспроизвести запись.'));return true}
 catch{report('Не удалось воспроизвести запись.');return false}
}
const dictionary={
 name:{'иван':['伊万','Yīwàn'],'антон':['安东','Āndōng'],'анна':['安娜','Ānnà'],'мария':['玛丽亚','Mǎlìyà']},
 city:{'калуга':['卡卢加','Kǎlújiā'],'москва':['莫斯科','Mòsīkē'],'пекин':['北京','Běijīng'],'шанхай':['上海','Shànghǎi'],'ош':['奥什','Àoshí'],'амстердам':['阿姆斯特丹','Āmǔsītèdān']},
 job:{'летчик':['飞行员','fēixíngyuán'],'лётчик':['飞行员','fēixíngyuán'],'пилот':['飞行员','fēixíngyuán'],'учитель':['老师','lǎoshī'],'врач':['医生','yīshēng'],'доктор':['医生','yīshēng'],'водитель':['司机','sījī'],'студент':['学生','xuésheng'],'инженер':['工程师','gōngchéngshī'],'менеджер':['经理','jīnglǐ'],'повар':['厨师','chúshī'],'программист':['程序员','chéngxùyuán']}
};
function mapProfile(type,raw){
 const text=String(raw||'').trim(),key=text.toLocaleLowerCase('ru-RU').replace(/\s+/g,' ');
 if(!text)return {zh:'',py:'',known:false};
 const row=dictionary[type]?.[key];if(row)return {zh:row[0],py:row[1],known:true};
 if(/^[\u3400-\u9fff·\s]+$/u.test(text))return {zh:text.replace(/\s/g,''),py:'',known:false};
 return {zh:'',py:'',known:false};
}
function recognize(expected,done){
 if(!SR()){done(null,'Этот браузер не поддерживает распознавание китайской речи.');return null}
 const r=new (SR())();let settled=false;
 function finish(result,message){if(settled)return;settled=true;done(result,message)}
 r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=3;r.continuous=false;
 r.onresult=ev=>{
   const alt=Array.from(ev.results?.[0]||[]).map(x=>x.transcript).filter(Boolean);
   const ok=alt.some(x=>match(x,expected));
   finish(ok,ok?'✓ Распознано верно.':'✕ Распознано: '+String(alt[0]||'неразборчиво').slice(0,45));
 };
 r.onerror=ev=>{
   const code=ev.error;
   if(code==='no-speech')finish(false,'✕ Речь не распознана.');
   else finish(null,code==='not-allowed'||code==='service-not-allowed'?'Нет разрешения на микрофон.':'Ошибка распознавания; попытка не засчитана.');
 };
 r.onend=()=>finish(false,'✕ Речь не распознана.');
 try{r.start()}catch{finish(null,'Микрофон не запустился.')}
 return r;
}
function score(attempts){return attempts.reduce((a,x)=>{if(x===true)a.right++;if(x===false)a.wrong++;return a},{right:0,wrong:0})}
function fixedResults(id,words,count){
 const key=StoragePrefix+id,signature=words.map(x=>x.zh).join('|')+'|'+count;
 const previous=load(key),results=previous?.signature===signature&&Array.isArray(previous.results)?previous.results:words.map(()=>[]);
 const data=words.map((_,i)=>Array.isArray(results[i])?results[i].filter(x=>x===true||x===false).slice(0,count):[]);
 function persist(){save(key,{signature,results:data})}
 return {data,persist,reset(){data.forEach(arr=>arr.splice(0));persist()},key};
}
function mountFinal(node,items){
 if(!node)return;
 const words=items.map(x=>({zh:String(x[0]),py:String(x[1]),ru:String(x[2])}));
 const progress=fixedResults('lesson1-final-5',words,5);
 let active=false,rec=null,info='';
 const totals=()=>score(progress.data.flat());
 function draw(){
  const t=totals();
  node.innerHTML='<div class="pg-final-head"><strong>🎤 Повтори все слова по 5 раз</strong><span>Всего: '+(t.right+t.wrong)+'/20</span></div>'+
   '<div class="pg-final-rows">'+words.map((word,i)=>{
    const attempts=progress.data[i],counts=score(attempts);
    return '<div class="pg-final-row"><button class="pg-final-word" type="button" data-final-word="'+i+'" '+(active||attempts.length>=5||!speechAvailable()?'disabled':'')+' aria-label="Произнести '+e(word.zh)+'"><b lang="zh-Hans">'+e(word.zh)+'</b><small>'+e(word.py)+'</small></button>'+
     '<div class="pg-final-marks">'+Array.from({length:5},(_,k)=>'<span class="'+(attempts[k]===true?'ok':attempts[k]===false?'bad':'empty')+'">'+(attempts[k]===true?'✓':attempts[k]===false?'✕':'·')+'</span>').join('')+'</div>'+
     '<div class="pg-final-row-totals"><b>✓ '+counts.right+'</b> <b>✕ '+counts.wrong+'</b></div></div>';
   }).join('')+'</div>'+
   '<div class="pg-final-summary"><span>✅ Правильно: <strong>'+t.right+'</strong></span><span>❌ Неправильно: <strong>'+t.wrong+'</strong></span></div>'+
   '<p class="pg-final-feedback" role="status">'+e(info)+'</p>'+
   '<div class="pg-final-foot"><span>Нажимай на слово и говори. Каждая попытка засчитывается, ошибки не блокируют следующий урок.</span>'+
   '<button type="button" data-reset-five>↻ Повторить тест</button></div>'+
   (!speechAvailable()?'<p class="pg-final-warning">Микрофонное распознавание в этом браузере недоступно. Переход к следующему уроку всё равно разрешён.</p>':'')+
   '<p class="pg-final-note">Оценивается распознанный текст, а не точность тонов. Браузер может передавать речь сервису распознавания.</p>';
  node.querySelectorAll('[data-final-word]').forEach(button=>button.addEventListener('click',()=>{
   const i=Number(button.dataset.finalWord);
   if(active||progress.data[i].length>=5)return;
   active=true;info='🎙️ Слушаю '+words[i].zh+'…';draw();
   rec=recognize([words[i].zh],(ok,msg)=>{
    rec=null;active=false;
    if(ok!==null){progress.data[i].push(ok);progress.persist()}
    info=msg;draw();
   });
  }));
  node.querySelector('[data-reset-five]')?.addEventListener('click',()=>{
   try{rec?.abort()}catch{}rec=null;active=false;progress.reset();info='Результаты этой тренировки сброшены. Можно начать заново.';draw();
  });
 }
 draw();
 return {getResults:()=>progress.data.map(x=>x.slice()),getSummary:totals};
}
function open({id,title,items}={}){
 if(!id||!Array.isArray(items)||!items.length)return;
 document.querySelector('#pg-hsk2-speaking-modal')?.remove();
 const words=items.map(x=>({zh:String(x.zh),ru:String(x.ru||''),targets:x.targets||[x.zh]})),count=3;
 const progress=fixedResults(id+'-3fixed',words,count);
 let active=false,rec=null,info='';
 const modal=document.createElement('div');modal.id='pg-hsk2-speaking-modal';modal.className='pg-speaking-backdrop';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',title||'Произношение');
 const next=()=>progress.data.findIndex(x=>x.length<3);
 function close(){try{rec?.abort()}catch{}rec=null;modal.remove()}
 function draw(){
  const idx=next(),finished=idx<0,t=score(progress.data.flat()),word=words[idx];
  modal.innerHTML='<section class="pg-speaking-panel"><header><b>🎤 '+e(title||'Повтори слова')+'</b><button data-close type="button">✕</button></header>'+
   '<div class="pg-speaking-progress">'+words.map((x,i)=>'<span class="'+(progress.data[i].length===3?'done':i===idx?'active':'')+'">'+e(x.zh)+' · '+progress.data[i].length+'/3</span>').join('')+'</div>'+
   (finished?'<h2>✅ Все попытки выполнены!</h2><p>Правильно: '+t.right+' · Ошибок: '+t.wrong+'. Можно продолжать обучение.</p>':
   '<div class="pg-speaking-target" lang="zh-Hans">'+e(word.zh)+'</div><p>'+e(word.ru)+'</p>'+
   '<strong>Попытка '+(progress.data[idx].length+1)+' из 3</strong>'+
   '<p class="pg-speaking-progress">'+progress.data[idx].map(v=>v?'✓':'✕').join('  ')+'</p>'+
   '<button type="button" data-mic '+(active||!speechAvailable()?'disabled':'')+'>'+(active?'🎙️ Слушаю…':'🎙️ Нажми и произнеси')+'</button>')+
   '<p class="pg-speaking-message" role="status">'+e(info)+'</p>'+
   '<small>Три попытки всего, не три подряд. Ошибки не блокируют переход. Распознавание речи не оценивает тоны.</small>'+
   '<button class="exit" data-close type="button">Вернуться в урок</button></section>';
  modal.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',close));
  modal.querySelector('[data-mic]')?.addEventListener('click',()=>{
   if(active||next()<0)return;
   active=true;info='🎙️ Слушаю…';draw();
   rec=recognize(words[idx].targets,(ok,msg)=>{active=false;rec=null;if(ok!==null){progress.data[idx].push(ok);progress.persist()}info=msg;draw()});
  });
 }
 document.body.appendChild(modal);draw();
}
W.PandaHSK2PracticeV326=Object.freeze({play,mapProfile,open,mountFinal,recognize,match,speechAvailable,key:id=>StoragePrefix+id});
W.PandaHSK2PracticeV324=W.PandaHSK2PracticeV326; // Compatibility for existing lesson and profile listeners.
})();
