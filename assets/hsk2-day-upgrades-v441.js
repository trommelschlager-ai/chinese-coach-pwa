/* Panda Go HSK2 v441 — opt-in daily timeline + guided adaptive speaking practice.
 * Wrap the approved 12-page course, do not replace its content, artwork, audio or scoring.
 * No fabricated MP3, no automatic grading of tones, no remote AI API.
 */
(function(){'use strict';
const base=window.PandaGoDayFirstUIV1;
if(!base || !window.PandaGoDayModulesV391 || window.PandaGoDayUpgradesV441)return;
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s||'').replace(/[\s。！？!?,，、.]/g,'');
const number=[['六','liù',6],['七','qī',7],['八','bā',8],['九','jiǔ',9],['十','shí',10],['十一','shíyī',11],['十二','shíèr',12]];
const num=n=>number.find(x=>x[2]===n)||[String(n),String(n),n];
const pad=n=>String(n).padStart(2,'0');
const time=(hour,minute=0)=>pad(hour)+':'+pad(minute);
const audio=zh=>{const found=!!window.PandaHsk2AudioV330?.lookup?.(zh);
 return found?'<button type="button" class="pg441-play" data-sound="'+safe(zh)+'" aria-label="Прослушать MP3: '+safe(zh)+'">🔊</button>':
 '<span class="pg441-audio-missing" title="Для этой фразы ещё нет проверенного MP3" aria-label="Аудиозапись пока недоступна">🔇</span>';
};
function routine(mini,preset){
 const idx=Math.max(0,Math.min(2,Number(preset)||0));
 if(mini===0){
  const hour=6+idx, n=num(hour),timeCn=n[0]+'点',py=n[1]+' diǎn';
  return [
   ['🌅',time(hour),`我早上${timeCn}起床。`,`Wǒ zǎoshang ${py} qǐchuáng.`,'Я встаю утром.'],
   ['💧',time(hour,10),`我早上${timeCn}十分洗脸。`,`Wǒ zǎoshang ${py} shí fēn xǐliǎn.`,'Я умываюсь.'],
   ['🪥',time(hour,20),`我早上${timeCn}二十分刷牙。`,`Wǒ zǎoshang ${py} èrshí fēn shuāyá.`,'Я чищу зубы.'],
   ['🥣',time(hour,30),`我早上${timeCn}半吃早饭。`,`Wǒ zǎoshang ${py} bàn chī zǎofàn.`,'Я завтракаю.']
  ];
 }
 if(mini===1){
  const h=7+idx,after=16+idx,a=num(h),b=num(after-12);
  return [
   ['💼',time(h),`我早上${a[0]}点上班。`,`Wǒ zǎoshang ${a[1]} diǎn shàngbān.`,'Я начинаю работу.'],
   ['🍜','12:00','我中午十二点吃午饭。','Wǒ zhōngwǔ shíèr diǎn chī wǔfàn.','Я обедаю в полдень.'],
   ['🏠',time(after),`我下午${b[0]}点下班。`,`Wǒ xiàwǔ ${b[1]} diǎn xiàbān.`,'Я заканчиваю работу.']
  ];
 }
 const dinner=18+idx,read=20+idx,sleep=22+idx;
 // Evening hours are written in standard Chinese conversational 6/7/8, 8/9/10, 10/11/12 (evening context).
 const d=num(dinner-12),r=num(read-12),s=num(sleep-12);
 return [
  ['🥢',time(dinner),`我晚上${d[0]}点吃晚饭。`,`Wǒ wǎnshang ${d[1]} diǎn chī wǎnfàn.`,'Я ужинаю.'],
  ['📖',time(read),`我晚上${r[0]}点看书。`,`Wǒ wǎnshang ${r[1]} diǎn kàn shū.`,'Я читаю книгу.'],
  ['🌙',time(sleep%24),`我晚上${s[0]}点睡觉。`,`Wǒ wǎnshang ${s[1]} diǎn shuìjiào.`,'Я ложусь спать.']
 ];
}
// No LLM impersonation: restricted 3-step conversation with checked exercise answers.
const dialogueSets=[
 [
  {q:'你每天几点起床？',py:'Nǐ měitiān jǐ diǎn qǐchuáng?',ru:'Во сколько ты каждый день встаёшь?',opts:['我每天七点起床。','我早上六点起床。'],hint:'Укажи время и действие 起床. Например: 我每天七点起床。',kind:'wake'},
  {q:'你起床以后做什么？',py:'Nǐ qǐchuáng yǐhòu zuò shénme?',ru:'Что делаешь после подъёма?',opts:['我先洗脸，再刷牙。','我早上吃早饭。'],hint:'Используй 洗脸, 刷牙 или 吃早饭. Например: 我先洗脸，再刷牙。',kind:'action'},
  {q:'你每天吃早饭吗？',py:'Nǐ měitiān chī zǎofàn ma?',ru:'Ты завтракаешь каждый день?',opts:['我每天吃早饭。','不，我不吃早饭。'],hint:'Ответь утвердительно или отрицательно со словами 吃早饭. Например: 我每天吃早饭。',kind:'breakfast'}
 ],
 [
  {q:'你早上先做什么？',py:'Nǐ zǎoshang xiān zuò shénme?',ru:'Что ты делаешь сначала утром?',opts:['我先刷牙，再吃早饭。','我先洗脸，再吃早饭。'],hint:'Используй 先 и действие: 我先刷牙，再吃早饭。',kind:'first'},
  {q:'你几点上班？',py:'Nǐ jǐ diǎn shàngbān?',ru:'Во сколько ты начинаешь работу?',opts:['我早上八点上班。','我九点上班。'],hint:'Укажи время и 上班. Например: 我早上八点上班。',kind:'work'},
  {q:'你几点下班？',py:'Nǐ jǐ diǎn xiàbān?',ru:'Во сколько ты заканчиваешь работу?',opts:['我下午五点下班。','我六点下班。'],hint:'Укажи время и 下班. Например: 我下午五点下班。',kind:'leave'}
 ],
 [
  {q:'你晚上常常做什么？',py:'Nǐ wǎnshang chángcháng zuò shénme?',ru:'Что ты часто делаешь вечером?',opts:['我晚上常常看书。','我晚上常常听音乐。'],hint:'Назови вечернее действие: 我晚上常常看书。',kind:'evening'},
  {q:'你几点睡觉？',py:'Nǐ jǐ diǎn shuìjiào?',ru:'Во сколько ты ложишься спать?',opts:['我晚上十一点睡觉。','我十点睡觉。'],hint:'Укажи время и 睡觉. Например: 我晚上十一点睡觉。',kind:'sleep'},
  {q:'你吃晚饭以后做什么？',py:'Nǐ chī wǎnfàn yǐhòu zuò shénme?',ru:'Что ты делаешь после ужина?',opts:['我吃晚饭以后看书。','我吃晚饭以后休息。'],hint:'Назови действие после ужина: 我吃晚饭以后看书。',kind:'after'}
 ]
];
const timeMark=s=>/([一二三四五六七八九十两百零〇0-9]{1,5})点(?:半|[一二三四五六七八九十两零〇0-9]+分?)?/.test(s);
function checkAnswer(kind,input){
 const s=plain(input);
 if(!s || s.length>100)return false;
 switch(kind){
 case 'wake':return s.includes('起床')&&timeMark(s);
 case 'action':return /洗脸|刷牙|吃早饭|吃早餐/.test(s);
 case 'breakfast':return /吃早饭|吃早餐|不吃早饭|不吃早餐/.test(s);
 case 'first':return /先/.test(s)&&/洗脸|刷牙|吃早饭|吃早餐|上班/.test(s);
 case 'work':return s.includes('上班')&&timeMark(s);
 case 'leave':return s.includes('下班')&&timeMark(s);
 case 'evening':return /看书|听音乐|看电影|运动|学习中文|休息|跑步/.test(s);
 case 'sleep':return s.includes('睡觉')&&timeMark(s);
 case 'after':return /看书|听音乐|休息|睡觉|学习|散步/.test(s);
 default:return false;
 }
}
function responseText(kind,input){
 if(kind==='wake'){const t=plain(input).match(/([一二三四五六七八九十两0-9]{1,5})点/);if(t)return `你${t[1]}点起床，很好！`}
 if(kind==='work')return '很好，你说了上班的时间。';
 if(kind==='leave')return '明白了，下班以后可以休息。';
 if(kind==='first')return '很好！先做一件事，再做另一件事。';
 if(kind==='breakfast')return /不吃/.test(input)?'明白了。记得照顾好自己。':'很好！吃早饭很重要。';
 if(kind==='evening')return '听起来很不错！';
 if(kind==='sleep')return '好的，早点休息。';
 if(kind==='after')return '很好！你的表达很自然。';
 return '好的，我明白了。';
}
const defaultDay=()=>({pg441TimelineOpen:false,pg441Preset:1,pg441DialogOpen:false,pg441DialogStep:0,pg441DialogHistory:[],pg441Feedback:'',pg441Consent:false});
function ensure(d){if(!d)return;const defaults=defaultDay();for(const [k,v] of Object.entries(defaults))if(d[k]===undefined)d[k]=Array.isArray(v)?[]:v}
function timeline(state){const d=state.day;ensure(d);
 const entries=routine(state.mini,d.pg441Preset),labels=state.mini===0?['06:00','07:00','08:00']:state.mini===1?['07:00','08:00','09:00']:['18:00','19:00','20:00'];
 return '<section class="pg441-wrap pg441-timeline" aria-label="Мой распорядок дня"><button type="button" class="pg441-toggle" data-pg441-timeline aria-expanded="'+!!d.pg441TimelineOpen+'"><span>🕒 Мой распорядок по времени</span><span>'+(d.pg441TimelineOpen?'Скрыть ▲':'Открыть ▼')+'</span></button>'+
 (d.pg441TimelineOpen?'<p class="pg441-muted">Выбери время начала. Схема покажет последовательность действий — затем попробуй рассказать о своём дне.</p><div class="pg441-presets" role="group" aria-label="Время начала">'+labels.map((x,i)=>'<button type="button" data-pg441-preset="'+i+'" aria-pressed="'+(d.pg441Preset===i)+'" class="'+(d.pg441Preset===i?'active':'')+'">'+x+'</button>').join('')+'</div><ol class="pg441-steps">'+entries.map(v=>'<li><div class="pg441-when"><strong>'+v[1]+'</strong><span>'+v[0]+'</span></div><div class="pg441-what"><b lang="zh-Hans">'+safe(v[2])+'</b><span>'+safe(v[3])+'</span><small>'+safe(v[4])+'</small></div>'+audio(v[2])+'</li>').join('')+'</ol>':'')+'</section>';
}
function bubble(who,zh,py,ru){return '<div class="pg441-bubble '+(who==='panda'?'panda':'student')+'"><span class="pg441-speaker">'+(who==='panda'?'🐼 Панда':'👤 Ты')+'</span><strong lang="zh-Hans">'+safe(zh)+'</strong>'+(py?'<span class="pg441-py">'+safe(py)+'</span>':'')+(ru?'<small>'+safe(ru)+'</small>':'')+(who==='panda'?audio(zh):'')+'</div>'}
function chat(state){const d=state.day;ensure(d);
 const scenario=dialogueSets[Math.max(0,Math.min(2,state.mini))],step=Math.max(0,Math.min(3,d.pg441DialogStep)),question=scenario[step];
 let inside='';
 if(d.pg441DialogOpen){
  inside='<p class="pg441-muted">Напиши ответ по-китайски или используй микрофон. Панда учитывает смысл и продолжает диалог. Тоны микрофоном здесь не оцениваются.</p>'+
   '<div class="pg441-history" aria-live="polite">'+(Array.isArray(d.pg441DialogHistory)?d.pg441DialogHistory.slice(-8).map(x=>bubble(x.who,x.zh,x.py,x.ru)).join(''):'')+
   (question?bubble('panda',question.q,question.py,question.ru):bubble('panda','你说得很好！我们继续练习吧。','Nǐ shuō de hěn hǎo! Wǒmen jìxù liànxí ba.','Отлично, продолжим практиковаться!'))+'</div>'+
   (d.pg441Feedback?'<div class="pg441-feedback" role="status">'+safe(d.pg441Feedback)+'</div>':'');
  if(question){inside+='<div class="pg441-suggestions">'+question.opts.map(s=>'<button type="button" data-pg441-choice="'+safe(s)+'">'+safe(s)+'</button>').join('')+'</div>'+
    '<div class="pg441-answerrow"><input id="pg441-answer" type="text" lang="zh-Hans" inputmode="text" autocomplete="off" maxlength="120" placeholder="Ответь на китайском…" aria-label="Твой ответ по-китайски"><button type="button" class="pg441-send" data-pg441-send>Ответить</button></div>'+
    '<div class="pg441-voice"><button type="button" data-pg441-voice '+(!(window.SpeechRecognition||window.webkitSpeechRecognition)?'disabled aria-label="Распознавание речи не поддерживается"':'')+'>🎙 Ответить голосом</button><small>Браузерное распознавание может передавать голос стороннему сервису.</small></div>';
  }else{inside+='<p class="pg441-success">✅ Три ответа приняты. Перейди к Panda AI для более свободного разговора.</p><button type="button" data-pg441-restart class="pg441-restart">↻ Повторить разговор</button>'}
  if(d.pg441AwaitConsent)inside+='<div class="pg441-consent" role="dialog" aria-label="Разрешение распознавания"><p>Для голосового ответа браузер может отправлять аудио в сервис распознавания. Согласен продолжить?</p><button type="button" data-pg441-allow>Разрешить</button><button type="button" data-pg441-deny>Отмена</button></div>';
 }
 return '<section class="pg441-wrap pg441-dialog" aria-label="Живой диалог с Пандой"><button type="button" class="pg441-toggle" data-pg441-dialog aria-expanded="'+!!d.pg441DialogOpen+'"><span>💬 Разговор с Пандой · 3 вопроса</span><span>'+(d.pg441DialogOpen?'Скрыть ▲':'Начать ▶')+'</span></button>'+inside+'</section>';
}
function insert(html,markup){const at=html.indexOf('</main>');return at<0?html:html.slice(0,at)+markup+html.slice(at)}
function submit(state,api,answer){const d=state.day;ensure(d);const question=dialogueSets[state.mini]?.[d.pg441DialogStep];
 if(!question)return true;
 const txt=String(answer||'').trim().slice(0,120);
 if(!checkAnswer(question.kind,txt)){d.pg441Feedback='Попробуй ещё раз. '+question.hint;api.render();return true}
 d.pg441DialogHistory.push({who:'student',zh:txt,py:'',ru:''});
 d.pg441DialogHistory.push({who:'panda',zh:responseText(question.kind,txt),py:'',ru:'Ответ понятен. Следующий вопрос ниже.'});
 d.pg441DialogHistory=d.pg441DialogHistory.slice(-12);
 d.pg441DialogStep=Math.min(3,d.pg441DialogStep+1);d.pg441Feedback='';api.render();return true;
}
function startMic(state,api){
 const d=state.day;const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){d.pg441Feedback='Распознавание не поддерживается. Напиши ответ вручную.';api.render();return true}
 try{
  const r=new Speech();r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>{const txt=e?.results?.[0]?.[0]?.transcript||'';
    if(document.querySelector('#pg441-answer'))submit(state,api,txt);
  };
  r.onerror=e=>{if(!document.querySelector('#pg441-answer'))return;d.pg441Feedback='Не удалось распознать ответ ('+String(e?.error||'ошибка')+'). Напиши его вручную.';api.render()};
  r.start();d.pg441Feedback='Слушаю твой ответ…';const status=document.querySelector('.pg441-feedback');if(status)status.textContent=d.pg441Feedback;
 }catch(e){d.pg441Feedback='Микрофон недоступен. Проверь разрешение Chrome.';api.render()}
 return true;
}
window.PandaGoDayFirstUIV1={
 ...base,
 makeState(mini){const d=base.makeState(mini);Object.assign(d,defaultDay());return d},
 render(state,ctx){const html=base.render(state,ctx);
  if(state.topic!==0||!state.day||state.day.pgApprovedCover||state.day.pg433Preview)return html;
  const page=Number(state.day.pg433Page)||0;
  if(page===10)return insert(html,timeline(state));
  if(page===11)return insert(html,chat(state));
  return html;
 },
 handle(button,state,api){const k=button?.dataset||{},d=state.day;
  if(state.topic!==0||!d)return base.handle(button,state,api);
  ensure(d);
  if(k.pg441Timeline!==undefined){d.pg441TimelineOpen=!d.pg441TimelineOpen;api.render();return true}
  if(k.pg441Preset!==undefined){d.pg441Preset=Math.max(0,Math.min(2,Number(k.pg441Preset)||0));api.render();return true}
  if(k.pg441Dialog!==undefined){d.pg441DialogOpen=!d.pg441DialogOpen;api.render();return true}
  if(k.pg441Choice!==undefined)return submit(state,api,k.pg441Choice);
  if(k.pg441Send!==undefined)return submit(state,api,document.querySelector('#pg441-answer')?.value);
  if(k.pg441Restart!==undefined){d.pg441DialogStep=0;d.pg441DialogHistory=[];d.pg441Feedback='';api.render();return true}
  if(k.pg441Voice!==undefined){if(!d.pg441Consent){d.pg441AwaitConsent=true;api.render();return true}return startMic(state,api)}
  if(k.pg441Allow!==undefined){d.pg441Consent=true;d.pg441AwaitConsent=false;api.render();return true}
  if(k.pg441Deny!==undefined){d.pg441AwaitConsent=false;api.render();return true}
  return base.handle(button,state,api);
 }
};
if(typeof document!=='undefined')document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target?.id==='pg441-answer'){
  e.preventDefault();document.querySelector('[data-pg441-send]')?.click();
 }
});
window.PandaGoDayUpgradesV441=Object.freeze({checkAnswer,routine,dialogueSets,version:441});
})();
