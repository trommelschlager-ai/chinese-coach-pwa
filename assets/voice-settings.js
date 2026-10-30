/* Optional Mandarin TTS voice and speed preferences.
   Only voices reported by the user's device are offered. */
(() => {
  'use strict';
  const section=document.getElementById('tones'),after=section?.querySelector('.tone-intro');
  if(!after || document.getElementById('mandarin-voice-settings'))return;
  const details=document.createElement('details');
  details.id='mandarin-voice-settings';
  details.className='mandarin-voice-settings';
  details.innerHTML=[
    '<summary>🔊 Голос китайского — выбрать и настроить</summary>',
    '<div class="voice-settings-inner">',
    '<label for="mandarin-voice-choice">Голос на этом телефоне</label>',
    '<div class="voice-settings-row">',
    '<select id="mandarin-voice-choice" aria-label="Китайский голос"></select>',
    '<button type="button" class="btn soft" id="mandarin-voice-preview">▶ Голос телефона</button>',
    '</div>',
    '<label for="mandarin-voice-rate">Скорость: <output id="mandarin-voice-rate-value">0,94×</output></label>',
    '<input type="range" min="0.70" max="1.10" step="0.02" id="mandarin-voice-rate" value="0.94">',
    '<p class="voice-settings-help" id="mandarin-voice-help" role="status" aria-live="polite"></p>',
    '<button type="button" class="voice-install-help" id="mandarin-voice-install">Как установить другой китайский голос?</button>',
    '</div>'
  ].join('');
  after.insertAdjacentElement('afterend',details);
  const select=details.querySelector('#mandarin-voice-choice');
  const rate=details.querySelector('#mandarin-voice-rate');
  const output=details.querySelector('#mandarin-voice-rate-value');
  const hint=details.querySelector('#mandarin-voice-help');
  const key='chinese-coach-tts-voice-v1',speedKey='chinese-coach-tts-rate-v2';
  const get=(k)=>{try{return localStorage.getItem(k)||''}catch(e){return ''}};
  const put=(k,value)=>{try{localStorage.setItem(k,value)}catch(e){}};
  const zhVoices=()=>('speechSynthesis' in window?window.speechSynthesis.getVoices():[])
    .filter(v=>/^(zh|cmn)(?:[-_]|$)/i.test(v.lang));
  function updateVoices(){
    const voices=zhVoices(),preferred=get(key);
    select.replaceChildren();
    const auto=document.createElement('option');
    auto.value='';const recommended=typeof chineseVoice==='function'?chineseVoice():null;auto.textContent=recommended?'Авто · '+recommended.name:'Автоматически — китайский';select.appendChild(auto);
    for(const voice of voices){
      const opt=document.createElement('option');
      opt.value=voice.voiceURI;
      opt.textContent=voice.name+' · '+voice.lang+(voice.localService?' · офлайн*':' · онлайн*');
      select.appendChild(opt);
    }
    select.value=voices.some(v=>v.voiceURI===preferred)?preferred:'';
    if(!('speechSynthesis' in window))hint.textContent='Этот браузер не поддерживает системную озвучку.';
    else if(!voices.length)hint.textContent='Китайские голоса пока не обнаружены. Проверь настройки синтеза речи телефона.';
    else if(voices.length===1)hint.textContent='Найден только один китайский голос. Чтобы действительно сменить звучание, установи другой голос в настройках телефона.';
    else hint.textContent='Доступно китайских голосов: '+voices.length+'. Автоматически выбирается более естественный голос из доступных. Качество зависит от устройства — сравни варианты.';
  }
  const savedText=get(speedKey);
  const savedRate=Number(savedText),previousRate=Number(get('chinese-coach-tts-rate-v1'));
  const touched=get('chinese-coach-tts-rate-custom-v55')==='1';
  // Preserve explicit new choices. Migrate the former automatic 0.82× speed:
  // heavy slowing made even genuine Mandarin recordings sound less natural.
  const initialRate=savedText&&savedRate>=.70&&savedRate<=1.10
    ?(Math.abs(savedRate-.82)<.001&&!touched?.94:savedRate)
    :(previousRate>=.70&&previousRate<.82?previousRate:.94);
  rate.value=String(initialRate);
  put(speedKey,rate.value);
  output.textContent=Number(rate.value).toFixed(2).replace('.',',')+'×';
  rate.addEventListener('input',()=>{
    output.textContent=Number(rate.value).toFixed(2).replace('.',',')+'×';
    put(speedKey,rate.value);
    put('chinese-coach-tts-rate-custom-v55','1');
  });
  select.addEventListener('change',()=>{
    put(key,select.value);
    hint.textContent='Выбор сохранён для сравнения голоса телефона. В уроках используются MP3; системный голос автоматически не включается.';
  });
  details.querySelector('#mandarin-voice-preview').addEventListener('click',()=>{
    if(typeof speakChinese==='function')speakChinese('你好！我很高兴认识你。',.95,true);
  });
  details.querySelector('#mandarin-voice-install').addEventListener('click',()=>{
    if(typeof showChineseVoiceHelp==='function')showChineseVoiceHelp();
  });
  if('speechSynthesis' in window){
    window.speechSynthesis.addEventListener?.('voiceschanged',updateVoices);
    setTimeout(updateVoices,800);
  }
  updateVoices();
})();