/* Panda Go: user-approved exact raster artwork + live HanziWriter controls.
   Art pixels are unchanged. Native learner logic, storage and audio stay in hanzi-lab.html. */
(()=>{
 'use strict';
 function init(){
  const oldShell=document.querySelector('body.writing-simple > .shell');
  const originalNext=document.getElementById('next');
  const originalCharacter=document.getElementById('character');
  const lexicon=document.getElementById('pg-hanzi-lexicon-list');
  const nativePaper=document.querySelector('.paper');
  if(!oldShell||!originalNext||!originalCharacter||!lexicon||!nativePaper||document.getElementById('pg-hanzi-approved'))return;
  const stage=document.createElement('main');
  stage.id='pg-hanzi-approved';
  stage.setAttribute('aria-label','Пишем иероглифы Panda Go');
  const hit=[
   ['back','Назад'],['strokes','Показать черты'],['write','Писать иероглиф'],
   ['speak','Послушать иероглиф'],['meaning','Значение'],['examples','Примеры'],['words','Слова'],
   ['example-0','Послушать пример 1'],['example-1','Послушать пример 2'],['example-2','Послушать пример 3'],
   ['next','Go еще — следующий иероглиф']
  ];
  stage.innerHTML='<img hidden class="pg-art" src="./assets/hanzi-approved-v141.png" alt="Panda Go: китайский свиток с иероглифом, сакура, озеро, кнопки Черты, Писать, примеры и Go еще." decoding="async" fetchpriority="high">'
   +'<div class="pg-art-stroke-paper"></div>'
   +'<div class="pg-dynamic-glyph" lang="zh-Hans" hidden></div>'
   +'<div class="pg-dynamic-pronounce" hidden><b lang="zh-Hans"></b><span></span></div>'
   +'<div class="pg-dynamic-meaning" hidden></div>'
   +'<div class="pg-dynamic-tabs" hidden><span>Значение</span><span>Примеры</span><span>Слова</span></div>'
   +'<img class="pg-panel-clean" src="./assets/hanzi-panel-v141.png" alt="" hidden>'
   +'<div class="pg-dynamic-panel" hidden aria-live="polite"></div>'
   +'<div class="pg-readable" id="pg-hanzi-reading"></div>'
   +'<div class="pg-art-status" role="status" aria-live="polite" hidden></div>'
   +hit.map(([key,label])=>'<button type="button" class="pg-hit pg-hit-'+key+'" data-art-hit="'+key+'" aria-label="'+label+'"></button>').join('');
  oldShell.insertAdjacentElement('afterend',stage);
  oldShell.setAttribute('aria-hidden','true');oldShell.inert=true;
  const $=sel=>stage.querySelector(sel);
  const canvasDock=$('.pg-art-stroke-paper');
  canvasDock.appendChild(nativePaper);
  let writingVisible=true;
  let previousCharacter=originalCharacter.textContent.trim();
  function showCanvas(){
   writingVisible=true;
   render();
  }
  const liveGlyph=$('.pg-dynamic-glyph'),livePron=$('.pg-dynamic-pronounce'),liveMeaning=$('.pg-dynamic-meaning');
  const liveTabs=$('.pg-dynamic-tabs'),livePanel=$('.pg-dynamic-panel'),liveStatus=$('.pg-art-status');
  const tabNames=['meaning','examples','words'];
  function activeTab(){return document.querySelector('.pg-lex-tab[aria-selected="true"]')?.dataset.hanziTab||'examples'}
  function render(){
   const ch=originalCharacter.textContent.trim()||'大',tab=activeTab();
   if(ch!==previousCharacter){previousCharacter=ch;writingVisible=true;}
   const isInitial=ch==='大';
   stage.dataset.dynamic=String(!isInitial);
   stage.setAttribute('aria-label','Иероглиф '+ch+' — '+document.getElementById('meaning').textContent);
   $('.pg-readable').textContent=document.getElementById('pinyin').textContent+'; '+lexicon.textContent;
   canvasDock.hidden=!writingVisible;
   liveGlyph.hidden=true;
   if(!liveGlyph.hidden)liveGlyph.textContent=ch;
   livePron.hidden=isInitial;
   liveMeaning.hidden=isInitial;
   if(!isInitial){
    livePron.querySelector('b').textContent=ch;
    livePron.querySelector('span').textContent=document.getElementById('pinyin')?.textContent||'';
    liveMeaning.textContent=document.getElementById('meaning')?.textContent||'';
    liveMeaning.dataset.long=String(liveMeaning.textContent.length>14);
   }
   liveTabs.hidden=tab==='examples';
   [...liveTabs.children].forEach((el,i)=>el.setAttribute('aria-current',String(tabNames[i]===tab)));
   const needsPanel=!isInitial||tab!=='examples';
   livePanel.hidden=!needsPanel;
   stage.querySelectorAll('[data-art-hit^="example-"]').forEach(button=>button.hidden=false);
   $('.pg-panel-clean').hidden=!isInitial||tab==='examples';
   if(!needsPanel)return;
   // Original 大 examples stay raster-exact; other states use clean source-derived layers.
   livePanel.replaceChildren();
   if(tab==='meaning'){
    const native=lexicon.querySelector('.pg-meaning-card');
    const heading=document.createElement('strong'),explanation=document.createElement('div'),note=document.createElement('small');
    heading.textContent=native?.querySelector('strong')?.textContent||ch;
    const shortNotes={'大':'Человек с разведёнными руками: «вот такой большой!»','人':'Два расходящихся штриха напоминают человека.','小':'Три компактных штриха. Противоположность 大 — большой.','一':'Одна горизонтальная черта, слева направо.','二':'Две черты: короткая сверху, длинная снизу.','三':'Три горизонтальные черты. Следи за длиной и порядком.','口':'Рот. Пиши тремя чертами, а не одним квадратом.','日':'Прямоугольник с внутренней горизонтальной чертой.','月':'Вытянутая форма с двумя чертами внутри.','木':'Вертикальный ствол и расходящиеся ветви дерева.'};
    explanation.textContent=shortNotes[ch]||document.getElementById('explanation').textContent;
    note.textContent=(native?.querySelector('small')?.textContent||'').split('.')[0]+'.';
    const box=document.createElement('div');box.className='pg-dynamic-explanation';
    box.append(heading,explanation,note);livePanel.append(box);
   }else{
    [...lexicon.querySelectorAll('.pg-lexicon-entry')].slice(0,3).forEach(row=>{
     const zh=row.querySelector('strong')?.textContent||'';
     const py=row.querySelector('small')?.textContent||'';
     const ru=row.querySelector('span:last-child')?.textContent||'';
     const item=document.createElement('div');item.className='pg-dynamic-row';
     const left=document.createElement('div');left.className='pg-left';
     const hanzi=document.createElement('strong');hanzi.lang='zh-Hans';hanzi.textContent=zh;
     const pinyin=document.createElement('small');pinyin.textContent=py;
     const russian=document.createElement('span');russian.className='pg-russian';russian.textContent='— '+ru;
     left.append(hanzi,pinyin);item.append(left,russian);livePanel.append(item);
    });
   }
  }
  const activateTab=key=>{const button=document.querySelector('.pg-lex-tab[data-hanzi-tab="'+key+'"]');button?.click();render()};
  stage.addEventListener('click',event=>{
   const btn=event.target.closest('button[data-art-hit]');if(!btn)return;
   const action=btn.dataset.artHit;
   if(action==='back'){const href=oldShell.querySelector('.back')?.getAttribute('href')||'./index.html';window.location.assign(href);return;}
   if(action==='speak'){document.getElementById('speak')?.click();return;}
   if(action==='strokes'||action==='write'){
    const nativeButton=document.getElementById(action==='strokes'?'animate':'practice');
    if(nativeButton?.disabled)return;
    showCanvas();
    requestAnimationFrame(()=>document.getElementById(action==='strokes'?'animate':'practice')?.click());
    return;
   }
   if(tabNames.includes(action)){activateTab(action);return;}
   if(action.startsWith('example-')){
    const n=Number(action.slice(-1));
    if(activeTab()==='meaning'){document.getElementById('speak')?.click();return;}
    lexicon.querySelectorAll('.pg-example-audio')[n]?.click();
    return;
   }
   if(action==='next'){
    writingVisible=true;
    originalNext.click();
    render();
   }
  });
  const refreshed=()=>requestAnimationFrame(render);
  const syncButtons=()=>{for(const [hit,id] of [['strokes','animate'],['write','practice']])$('[data-art-hit='+hit+']').disabled=document.getElementById(id).disabled;};
  new MutationObserver(syncButtons).observe(document.getElementById('animate'),{attributes:true,attributeFilter:['disabled']});
  syncButtons();
  new MutationObserver(refreshed).observe(originalCharacter,{childList:true,characterData:true,subtree:true});
  new MutationObserver(refreshed).observe(lexicon,{childList:true,subtree:true});
  const feedback=document.getElementById('feedback');
  if(feedback)new MutationObserver(()=>{
   if(feedback.classList.contains('bad')||document.body.dataset.writingStage==='writing'||document.body.dataset.writingStage==='complete'){
    let message=feedback.textContent.trim();
    if(document.body.dataset.writingStage==='complete')message='Верно! '+originalCharacter.textContent+' написан.';
    else if(message.startsWith('Пока неверно'))message='Повтори черту. '+(message.match(/Ошибок: \d+/)?.[0]||'');
    else if(message.startsWith('Твоя очередь!'))message='Пиши черты в правильном порядке.';
    liveStatus.textContent=message;liveStatus.setAttribute('aria-label',feedback.textContent.trim());liveStatus.hidden=false;
   }else liveStatus.hidden=true;
  }).observe(feedback,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  // Ensure the interactive drawing canvas follows the image when the viewport changes.
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{
   if(writingVisible){const writer=document.getElementById('writer');if(writer)writer.style.width='100%';}
  }).observe(stage);
  render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();