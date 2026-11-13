/* Panda Go HSK2 v324. Browser transcription is NOT a tonal-acoustic assessment. */
(()=>{'use strict';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').normalize('NFKC').replace(/[，。！？、,.!?;；：:\s"'“”‘’()\[\]{}\-—·]/g,'');
const clips={'很':'./assets/owner-clean-v237/2ddeccad2b8bf7e6.mp3'};
let audio=null;
function play(zh,report){
 const src=clips[zh];
 if(!src){report('Для «'+zh+'» запись носительницы ещё не подключена. Другой голос не используем.');return false}
 try{audio?.pause();audio=new Audio(src);audio.playbackRate=.9;audio.preservesPitch=true;
 audio.onerror=()=>report('MP3 не загрузился. Проверь интернет.');
 const p=audio.play();p?.catch?.(()=>report('Нажми на карточку ещё раз, чтобы включить звук.'));return true}
 catch{report('Не удалось запустить аудио.');return false}
}
const dictionary={
 name:{'иван':['伊万','Yīwàn'],'антон':['安东','Āndōng'],'анна':['安娜','Ānnà'],'мария':['玛丽亚','Mǎlìyà']},
 city:{'калуга':['卡卢加','Kǎlújiā'],'москва':['莫斯科','Mòsīkē'],'пекин':['北京','Běijīng'],'шанхай':['上海','Shànghǎi'],'ош':['奥什','Àoshí'],'амстердам':['阿姆斯特丹','Āmǔsītèdān']},
 job:{'летчик':['飞行员','fēixíngyuán'],'лётчик':['飞行员','fēixíngyuán'],'пилот':['飞行员','fēixíngyuán'],'учитель':['老师','lǎoshī'],'врач':['医生','yīshēng'],'доктор':['医生','yīshēng'],'водитель':['司机','sījī'],'студент':['学生','xuésheng'],'инженер':['工程师','gōngchéngshī'],'менеджер':['经理','jīnglǐ'],'повар':['厨师','chúshī'],'программист':['程序员','chéngxùyuán']}
};
function mapProfile(type,raw){
 const text=String(raw||'').trim(),key=text.toLocaleLowerCase('ru-RU').replace(/\s+/g,' ');
 if(!text)return {zh:'',py:'',known:false};
 const value=dictionary[type]?.[key];
 if(value)return {zh:value[0],py:value[1],known:true};
 if(/^[\u3400-\u9fff·\s]+$/u.test(text))return {zh:text.replace(/\s/g,''),py:'',known:false};
 return {zh:'',py:'',known:false};
}
const recognition=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
const match=(spoken,expected)=>!!norm(spoken)&&expected.some(x=>norm(spoken)===norm(x));
const key=id=>'pg-hsk2-speaking-v324:'+id;
function open({id,title,items}){
 if(!id||!items?.length)return;
 document.querySelector('#pg-hsk2-speaking-modal')?.remove();
 const targets=items.map(v=>({zh:String(v.zh),ru:String(v.ru||''),expected:v.targets||[v.zh]}));
 let scores=targets.map(()=>0);
 try{const saved=JSON.parse(localStorage.getItem(key(id))||'null');
 if(saved?.words===targets.map(x=>x.zh).join('|')&&saved.scores?.length===scores.length)
 scores=scores.map((_,i)=>Math.max(0,Math.min(3,Number(saved.scores[i])||0)))}catch{}
 const persist=()=>{try{localStorage.setItem(key(id),JSON.stringify({words:targets.map(x=>x.zh).join('|'),scores}))}catch{}};
 const modal=document.createElement('div');modal.id='pg-hsk2-speaking-modal';modal.className='pg-speaking-backdrop';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',title||'Проверка речи');
 let currentRecognition=null,busy=false,message='';
 const index=()=>scores.findIndex(s=>s<3);
 function close(){try{currentRecognition?.abort()}catch{}modal.remove()}
 function draw(){
 const i=index(),item=targets[i],done=i<0;
 modal.innerHTML='<section class="pg-speaking-panel"><header><b>🎤 '+esc(title||'Тест произношения')+'</b><button data-close type="button">✕</button></header>'+
 '<div class="pg-speaking-progress">'+targets.map((t,n)=>'<span class="'+(scores[n]===3?'done':n===i?'active':'')+'">'+esc(t.zh)+' '+scores[n]+'/3</span>').join('')+'</div>'+
 (done?'<h2>✅ Тест пройден!</h2><p>Все слова распознаны по 3 раза подряд.</p>':
 '<div class="pg-speaking-target" lang="zh-Hans">'+esc(item.zh)+'</div><p>'+esc(item.ru)+'</p>'+
 '<strong>Верно подряд: '+scores[i]+' / 3</strong><p>Ошибся — счётчик этой фразы сбрасывается до нуля.</p>'+
 '<button data-mic type="button" '+(!recognition()?'disabled':'')+'>'+ (busy?'🎙️ Слушаю…':'🎙️ Нажать и сказать')+'</button>'+
 (!recognition()?'<p>Распознавание речи в этом браузере недоступно. Тест не засчитывается.</p>':''))+
 '<div class="pg-speaking-message" role="status">'+esc(message)+'</div>'+
 '<small>Проверяется текст, распознанный браузером, а не правильность тонов. Сервис распознавания может обрабатывать аудио через интернет.</small>'+
 '<button class="exit" data-close type="button">Вернуться в урок</button></section>';
 modal.querySelectorAll('[data-close]').forEach(el=>el.onclick=close);
 const mic=modal.querySelector('[data-mic]');if(mic)mic.onclick=listen;
 }
 function listen(){
 if(busy||index()<0||!recognition())return;
 const i=index(),R=recognition(),r=new R();currentRecognition=r;busy=true;message='';draw();
 let resolved=false;r.lang='zh-CN';r.interimResults=false;r.continuous=false;r.maxAlternatives=3;
 r.onresult=e=>{
 if(currentRecognition!==r)return;resolved=true;
 const alts=Array.from(e.results?.[0]||[]).map(x=>x.transcript);
 const correct=alts.some(x=>match(x,targets[i].expected));
 if(correct){scores[i]=Math.min(3,scores[i]+1);message='✓ Правильно распознано. '+(scores[i]===3?'Переходим к следующему.':'Повтори ещё раз.')}
 else{scores[i]=0;message='✕ Распознано: '+String(alts[0]||'неразборчиво').slice(0,50)+'. Снова 0/3.'}
 persist();busy=false;currentRecognition=null;draw();
 };
 r.onerror=e=>{
 if(currentRecognition!==r)return;resolved=true;busy=false;currentRecognition=null;
 if(e.error==='no-speech'){scores[i]=0;persist();message='Не услышал речь. Счётчик 0/3.'}
 else message=e.error==='not-allowed'?'Разреши доступ к микрофону в браузере.':'Ошибка распознавания. Результат не засчитан.';
 draw();
 };
 r.onend=()=>{if(currentRecognition===r&&!resolved){currentRecognition=null;busy=false;message='Ничего не распознано. Попробуй ещё раз.';draw()}};
 try{r.start()}catch{busy=false;currentRecognition=null;message='Не удалось включить микрофон.';draw()}
 }
 document.body.appendChild(modal);draw();
}
window.PandaHSK2PracticeV324=Object.freeze({play,mapProfile,open,match,speechAvailable:()=>!!recognition(),key});
})();
