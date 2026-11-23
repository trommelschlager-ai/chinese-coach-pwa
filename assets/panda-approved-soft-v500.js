/* Panda AI v500: approved day/night screen behaviour.
   Additive presentation only; all course, speech, history and audio routes still run through v346.
*/
(function () {
  'use strict';
  const STORAGE_KEY='panda-ai-theme-v500';
  const NS='http://www.w3.org/2000/svg';
  const GESTURES='idle listening talking';
  const pict={
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.1-7.1-1.4 1.4m-11.4 11.4-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9"/>',
    moon:'<path d="M20.5 15.5A9 9 0 0 1 8.5 3.5 9.1 9.1 0 1 0 20.5 15.5Z"/>'
  };
  const svg=(path)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const word=(tag,cls,text)=>{
    const node=document.createElement(tag);node.className=cls;
    node.textContent=text;return node;
  };
  function init(stage){
    if(stage.dataset.pg500Mounted==='true')return;
    if(!stage.querySelector('#pg346-send')||!stage.querySelector('.pg346-header'))return;
    stage.dataset.pg500Mounted='true';
    const header=stage.querySelector('.pg346-header');
    const tools=stage.querySelector('.pg346-tools');
    const history=stage.querySelector('.pg346-history');
    const scene=stage.querySelector('.pg346-scene');
    const send=stage.querySelector('#pg346-send');
    const input=stage.querySelector('#pg346-input');
    const form=stage.querySelector('#pg346-form');
    const speech=stage.querySelector('.pg346-speech');
    if(!header||!tools||!history||!scene||!send||!input||!form)return;

    // v501 sky layer: night gets real darkness instead of blue sky with a moon pasted onto it.
    const landscape=document.createElement('div');landscape.className='pg500-landscape';
    landscape.setAttribute('aria-hidden','true');
    stage.prepend(landscape);
        // Two independently accessible modes; night displays the last approved artwork tone.
    const switcher=document.createElement('div');
    switcher.className='pg500-theme-switch';
    switcher.setAttribute('role','group');
    switcher.setAttribute('aria-label','Цветовая тема');
    const day=document.createElement('button');
    day.type='button';day.dataset.setTheme='day';day.setAttribute('aria-label','Дневная тема');
    day.innerHTML=svg(pict.sun);
    const night=document.createElement('button');
    night.type='button';night.dataset.setTheme='night';night.setAttribute('aria-label','Ночная тема');
    night.innerHTML=svg(pict.moon);
    switcher.append(day,night);tools.append(switcher);
    function theme(next){
      const value=next==='day'?'day':'night';
      stage.dataset.theme=value;
      day.setAttribute('aria-pressed',String(value==='day'));
      night.setAttribute('aria-pressed',String(value==='night'));
      try{localStorage.setItem(STORAGE_KEY,value)}catch(_){}
    }
    let saved='night';try{saved=localStorage.getItem(STORAGE_KEY)||'night'}catch(_){}
    theme(saved);
    day.addEventListener('click',()=>theme('day'));
    night.addEventListener('click',()=>theme('night'));

    // Right-hand shortcuts reuse existing app destinations and speech controls.
    const navGame=stage.querySelector('.pg346-nav a[href="./game.html"]');
    const navBook=stage.querySelector('.pg346-nav a[href="./hsk1-map.html"]');
    const rail=stage.querySelector('.pg346-side-rail');
    function sideButton(css,inner,label,text){
      const button=document.createElement('button');button.type='button';button.className='pg500-side '+css;
      button.setAttribute('aria-label',label);button.innerHTML=inner;button.append(word('span','',text));return button;
    }
    const game=sideButton('pg500-side-game',navGame?.querySelector('svg')?.outerHTML||'🎮','Открыть тренажёр','Тренажёр');
    rail.prepend(game);
    game.addEventListener('click',()=>{location.href='./game.html'});
    const book=sideButton('pg500-side-book',navBook?.querySelector('svg')?.outerHTML||'📖','Текущая фраза Панды и прослушивание','Уроки');
    rail.append(book);
    book.setAttribute('aria-expanded','false');
    book.addEventListener('click',()=>{
      const open=stage.dataset.detailsOpen!=='true';
      stage.dataset.detailsOpen=String(open);
      book.setAttribute('aria-expanded',String(open));
    });
    if(speech){
      const study=word('button','pg500-study-link','Подсказки и новые слова');
      study.type='button';
      study.addEventListener('click',()=>document.getElementById('study-open')?.click());
      speech.append(study);
    }

    // The plane is a toggle until text has been entered. No dummy send is possible.
    stage.dataset.composerOpen='false';
    const cross=word('button','pg500-close-input','×');cross.type='button';
    cross.setAttribute('aria-label','Закрыть ввод текста');form.append(cross);
    // v542: Keep the ORIGINAL approved mascot in the scenic DOM for audio/AI.
    // A separate visible COPY of its approved image is locked to the stage,
    // so resizing the chat history/keyboard can never relocate the portrait.
    // Importantly, never move the original DOM node (v541 made Panda vanish).
    const mascot=scene.querySelector('.pg352-mascot');
    let frozenAttempt=false;
    function rememberPandaGeometry(){
      if(frozenAttempt||!mascot||document.documentElement.dataset.keyboard==='true')return;
      const picture=mascot.querySelector('.pg346-panda');
      if(!picture?.complete||!picture.naturalWidth)return;
      const ir=picture.getBoundingClientRect();
      const sr=scene.getBoundingClientRect(),pr=stage.getBoundingClientRect();
      const stone=getComputedStyle(scene,'::before');
      const w=parseFloat(stone.width),left=parseFloat(stone.left),bottom=parseFloat(stone.bottom);
      if(ir.width<90||ir.height<90||!Number.isFinite(w)||w<90||!Number.isFinite(left)||!Number.isFinite(bottom))return;
      const layer=word('div','pg542-static-layer','');
      const back=word('div','pg542-static-stone pg542-static-back','');
      const front=word('div','pg542-static-stone pg542-static-front','');
      const frozen=word('img','pg542-frozen-panda','');
      frozen.alt='';frozen.draggable=false;frozen.decoding='async';
      const set=(k,n)=>layer.style.setProperty(k,n+'px');
      set('--pg542-panda-x',ir.left-pr.left);
      set('--pg542-panda-y',ir.top-pr.top);
      set('--pg542-panda-w',ir.width);
      set('--pg542-panda-h',ir.height);
      set('--pg542-stone-x',sr.left-pr.left+left);
      set('--pg542-stone-y',sr.bottom-pr.top-bottom-w*207/600);
      set('--pg542-stone-w',w);
      set('--pg542-stone-h',w*207/600);
      layer.append(back,frozen,front);
      stage.append(layer);
      frozenAttempt=true;
      const commit=()=>{
        if(!frozen.naturalWidth||!frozen.naturalHeight)return;
        stage.dataset.pandaStatic='true';
      };
      frozen.addEventListener('load',commit,{once:true});
      frozen.addEventListener('error',()=>{layer.remove();frozenAttempt=false},{once:true});
      frozen.src=picture.currentSrc||picture.src;
      if(frozen.complete&&frozen.naturalWidth)commit();
    }
    requestAnimationFrame(rememberPandaGeometry);
    mascot?.querySelector('.pg346-panda')?.addEventListener('load',()=>requestAnimationFrame(rememberPandaGeometry),{once:true});
    function opened(){return stage.dataset.composerOpen==='true'}
    function openComposer(){
      rememberPandaGeometry();
      stage.dataset.composerOpen='true';
      send.setAttribute('aria-label','Отправить сообщение');
      input.focus({preventScroll:true});
    }
    function closeComposer(){
      stage.dataset.composerOpen='false';
      send.setAttribute('aria-label','Открыть ввод текста');
      if(document.activeElement===input)input.blur();
    }
    send.setAttribute('aria-label','Открыть ввод текста');
    send.addEventListener('click',(event)=>{
      // An occupied input is always a SEND action, even if Android changed
      // focus/composer state while committing Chinese IME text.
      if(!input.value.trim()&&!opened()){
        event.preventDefault();event.stopImmediatePropagation();openComposer();return;
      }
      // Keep click propagation intact: the real UI send handler sends once.
      if(input.value.trim()&&!opened())stage.dataset.composerOpen='true';
    },true);
    form.addEventListener('submit',()=>queueMicrotask(()=>{if(!input.value.trim())closeComposer()}));
    input.addEventListener('focus',()=>{rememberPandaGeometry();if(!opened())stage.dataset.composerOpen='true'});
    cross.addEventListener('click',(event)=>{event.stopPropagation();closeComposer()});
    stage.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened()){closeComposer()}});
    scene.addEventListener('click',event=>{
      if(opened()&&!event.target.closest('#pg346-topics,#pg346-topics-btn,#pg346-input'))closeComposer();
    });

    // More low-speed falling petals; reduced-motion is handled by the CSS.
    const petals=stage.querySelector('.pg354-petals');
    if(petals){
      while(petals.children.length<18)petals.append(document.createElement('i'));
      Array.from(petals.children).forEach((petal,i)=>{
        petal.style.setProperty('--x', (2+(i*37)%93)+'%');
        petal.style.setProperty('--w', (5+(i%4)*1.3)+'px');
        petal.style.setProperty('--duration', (13+(i*7)%13)+'s');
        petal.style.setProperty('--delay', (-2-(i*5)%24)+'s');
        petal.style.setProperty('--drift', (-36+(i*19)%80)+'px');
      });
    }

    // Do not insert example cards into live chat: every visible turn must be real.

  }
  function watch(){
    const stage=document.getElementById('pg346');
    if(stage){init(stage);return true}
    return false;
  }
  if(!watch()){
    const observer=new MutationObserver(()=>{if(watch())observer.disconnect()});
    observer.observe(document.documentElement,{subtree:true,childList:true});
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  }
})();
