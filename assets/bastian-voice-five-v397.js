/* Panda Go · Бастиан: второй экран — 10 слов × 5 настоящих попыток.
 * Only actual Web Speech Recognition transcripts count; tone acoustics aren't scored.
 */
(function(){
'use strict';
const SR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
const normalize=s=>String(s||'').normalize('NFKC').replace(/[，。？！?!,.、\s]/g,'').replace(/^我说/,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fresh=()=>({chosen:0,attempts:Array.from({length:10},()=>[]),consent:false,askConsent:false,skip:false,confirmSkip:false,message:''});
let active=null;
function ensure(state){
 if(!state.voice397||!Array.isArray(state.voice397.attempts)||state.voice397.attempts.length!==10)state.voice397=fresh();
 for(let i=0;i<10;i++)if(!Array.isArray(state.voice397.attempts[i]))state.voice397.attempts[i]=[];
 return state.voice397;
}
function cancel(){if(active){const r=active;active=null;r.onresult=null;r.onerror=null;r.onend=null;try{r.abort()}catch{}}}
function match(zh,spoken){
 const a=normalize(zh),b=normalize(spoken);
 if(a==='二十五')return b==='25'||b==='二十五';
 return a===b;
}
function total(state){
 const v=ensure(state),completed=v.attempts.reduce((n,a)=>n+a.length,0),correct=v.attempts.reduce((n,a)=>n+a.filter(x=>x.ok).length,0);
 return {completed,correct,remaining:50-completed,canNext:completed===50||v.skip};
}
function render(state,words,showPy,hasAudio){
 const v=ensure(state),result=total(state),listen=typeof hasAudio==='function'?hasAudio:()=>false;
 const chosen=words[v.chosen];
 let html='<section class="pg397" aria-label="Произношение пятидесяти попыток">'+
 '<div class="pg397-heading"><h3>🎙 Произношение — 5 раз</h3><span>'+result.completed+'/50</span></div>'+
 '<p class="pg397-instruction">Выбери слово и произнеси его пять раз. Результаты появятся после распознавания.</p>'+
 '<div class="pg397-grid">'+words.map((w,i)=>{
 const a=v.attempts[i];
 return '<article class="pg397-tile'+(v.chosen===i?' chosen':'')+'" data-voice-select="'+i+'">'+
 '<button type="button" class="pg397-pick" data-voice-select="'+i+'" aria-pressed="'+(v.chosen===i)+'" aria-label="Выбрать '+esc(w[0])+'"><strong lang="zh-Hans">'+esc(w[0])+'</strong></button>'+
 '<span class="pg397-ru">'+esc(w[2])+'</span>'+
 (showPy?'<span class="pg397-pinyin">'+esc(w[1])+'</span>':'')+
 (listen(w[0])?'<button type="button" class="pg397-play" data-voice-audio="'+i+'" aria-label="Слушать '+esc(w[0])+'">▶</button>':'<span class="pg397-noaudio" title="MP3 пока нет">🔇</span>')+
 '<div class="pg397-dots" aria-label="'+a.length+' из 5 попыток">'+[0,1,2,3,4].map(n=>{
 const x=a[n];return '<span class="pg397-dot '+(x?(x.ok?'ok':'bad'):'empty')+'" title="'+(x?esc(x.heard):'Ожидает попытку')+'">'+(x?(x.ok?'✓':'×'):'·')+'</span>'
 }).join('')+'</div></article>'
 }).join('')+'</div>'+
 '<div class="pg397-action"><div class="pg397-current"><span>Сейчас:</span> <strong lang="zh-Hans">'+esc(chosen[0])+'</strong>'+(showPy?'<small>'+esc(chosen[1])+'</small>':'')+'</div>'+
 '<button type="button" class="pg397-record" data-voice-record'+(!SR()||active||v.attempts[v.chosen].length>=5?' disabled':'')+'>'+(active?'🎙 Слушаю…':'🎙 Произнести')+'</button></div>'+
 (!SR()?'<p class="pg397-notice">В этом браузере нет распознавания речи. Можно перейти дальше без речевой оценки.</p>':'')+
 (v.askConsent?'<div class="pg397-consent"><p>Для распознавания понадобится микрофон. Браузер может отправлять запись своему сервису распознавания. Panda Go не сохраняет аудиозапись.</p><button type="button" data-voice-allow>Разрешить микрофон</button><button type="button" data-voice-dismiss>Отмена</button></div>':'')+
 (v.message?'<p class="pg397-notice" role="status">'+esc(v.message)+'</p>':'')+
 '<div class="pg397-summary"><strong>Итог: '+result.correct+' из '+result.completed+' распознано</strong><span>Всего попыток: '+result.completed+'/50</span></div>'+
 '<div class="pg397-actions"><button type="button" data-voice-listen>🔊 Слушать слово</button>'+
 (v.skip?'<span class="pg397-skipped">Без речевой оценки</span>':(v.confirmSkip?'<div class="pg397-confirm"><span>Перейти дальше без проверки речи?</span><button type="button" data-voice-skip-confirm>Продолжить без оценки</button><button type="button" data-voice-skip-cancel>Отмена</button></div>':'<button type="button" data-voice-skip>Без микрофона</button>'))+'</div>'+
 '<details class="pg397-tones"><summary>Памятка по тонам</summary><p>zhù, zài и suì — четвёртый тон. 工程师 gōngchéngshī — 1–2–1. В 你好 первый третий тон перед третьим произносится как второй: ní hǎo.</p></details>'+
 '</section>';
 return html;
}
function begin(state,words,rerender){
 const v=ensure(state),wordIndex=v.chosen;
 if(!SR()){v.message='Распознавание речи недоступно.';rerender();return;}
 if(active||v.attempts[wordIndex].length>=5)return;
 const r=new (SR())();active=r;v.message='';
 r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=3;let got=false;
 r.onresult=e=>{
  if(active!==r)return;
  const alternatives=Array.from(e.results?.[0]||[]).map(x=>String(x.transcript||''));
  if(!alternatives.length)return;
  got=true;
  const correct=alternatives.some(text=>match(words[wordIndex][0],text));
  v.attempts[wordIndex].push({heard:alternatives[0],ok:correct});
  if(v.attempts[wordIndex].length===5){
   const next=v.attempts.findIndex(x=>x.length<5);
   if(next>=0)v.chosen=next;
  }
  v.message=correct?'✓ Слово распознано.':'Распознано другое слово: '+alternatives[0];
 };
 r.onerror=e=>{
  if(active!==r)return;
  v.message='Распознавание не удалось ('+String(e.error||'ошибка')+'). Попробуй ещё раз.';
 };
 r.onend=()=>{if(active!==r)return;active=null;if(!got&&!v.message)v.message='Речь не распознана, повтори попытку.';rerender()};
 try{r.start();rerender()}catch(e){active=null;v.message='Не удалось запустить микрофон. Проверь разрешение.';rerender()}
}
function handle(button,state,words,rerender,play){
 const v=ensure(state),d=button.dataset;
 if(d.voiceSelect!==undefined){if(active)return true;v.chosen=Math.max(0,Math.min(9,Number(d.voiceSelect)||0));v.message='';rerender();return true}
 if(d.voiceAudio!==undefined){const w=words[Number(d.voiceAudio)];if(w)play(w[0]);return true}
 if(d.voiceListen!==undefined){play(words[v.chosen][0]);return true}
 if(d.voiceRecord!==undefined){if(!v.consent){v.askConsent=true;rerender()}else begin(state,words,rerender);return true}
 if(d.voiceAllow!==undefined){v.consent=true;v.askConsent=false;begin(state,words,rerender);return true}
 if(d.voiceDismiss!==undefined){v.askConsent=false;rerender();return true}
 if(d.voiceSkip!==undefined){v.confirmSkip=true;rerender();return true}
 if(d.voiceSkipCancel!==undefined){v.confirmSkip=false;rerender();return true}
 if(d.voiceSkipConfirm!==undefined){cancel();v.skip=true;v.confirmSkip=false;v.message='Урок продолжен без речевой оценки.';rerender();return true}
 return false;
}
window.PandaBastianVoice397=Object.freeze({ensure,render,handle,total,cancel,reset:()=>fresh()});
})();