/* Panda Go v393. Two genuine Bastian study screens, preserving original MP3 player and five-step practice. */
(()=>{'use strict';
 const poster=document.getElementById('poster');
 if(!poster||poster.dataset.splitMounted)return;
 poster.dataset.splitMounted='1';
 const phrases=[
  ['你好，我叫巴斯蒂安。',"Nǐ hǎo, wǒ jiào Bāsīdì'ān.",'Привет, меня зовут Бастиан.'],
  ['我二十五岁。','Wǒ èrshíwǔ suì.','Мне 25 лет.'],
  ['我住在莫斯科。','Wǒ zhù zài Mòsīkē.','Я живу в Москве.'],
  ['我是工程师。','Wǒ shì gōngchéngshī.','Я инженер.']
 ];
 const safe=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const row=(i)=>{let p=phrases[i];return '<article class="bs393-phrase"><span class="bs393-num">'+(i+1)+'</span><div><strong lang="zh-Hans">'+safe(p[0])+'</strong><em>'+safe(p[1])+'</em><span>'+safe(p[2])+'</span></div><button type="button" data-audio-ref="'+i+'" aria-label="Прослушать фразу '+(i+1)+'">▶</button></article>'};
 const screen1=document.createElement('section');
 screen1.className='bs393-screen';screen1.dataset.bsPage='1';
 screen1.innerHTML='<header class="bs393-bar"><a href="./hsk2-life-course.html?view=map" aria-label="К утверждённой карте курса">‹</a><span>Урок 1 · Знакомство</span><small>1 / 2</small></header>'+
  '<div class="bs393-heading"><b>Panda Go 🐾</b><h1>Знакомься, это Бастиан</h1><p>Слушай, читай и повторяй вслух.</p></div>'+
  '<div class="bs393-portrait"><img src="./assets/bastian-approved-v1.avif" alt="Бастиан в фиолетовой куртке и наушниках" loading="eager"></div>'+
  '<div class="bs393-lines">'+row(0)+row(1)+'</div>'+
  '<aside class="bs393-note"><b>💡 Запомни:</b> 我叫 + имя — меня зовут…; 我 + возраст + 岁 — мне … лет. В 你好 первый третий тон произносится как второй: ní hǎo.</aside>'+
  '<button class="bs393-next" type="button" data-bs-next>Дальше · фразы 3–4 ›</button>';
 const screen2=document.createElement('section');
 screen2.className='bs393-screen';screen2.dataset.bsPage='2';screen2.hidden=true;
 screen2.innerHTML='<header class="bs393-bar"><button type="button" data-bs-back aria-label="К предыдущей странице">‹</button><span>Урок 1 · Знакомство</span><small>2 / 2</small></header>'+
  '<div class="bs393-heading"><b>Panda Go 🐾</b><h1>Где живёт и кем работает</h1><p>Ещё две фразы, затем практика.</p></div>'+
  '<div class="bs393-lines">'+row(2)+row(3)+'</div>'+
  '<section class="bs393-learn"><h2>📖 Разбор по шагам</h2><p><strong>住在 + место</strong> — жить в…</p><p><strong>我是 + профессия</strong> — я работаю / являюсь…</p><p><strong>工程师</strong> — инженер; <strong>莫斯科</strong> — Москва</p></section>'+
  '<section class="bs393-learn"><h2>🎧 Важные тоны</h2><div class="bs393-tones"><button type="button" data-term="住">zhù · 4-й ↘</button><button type="button" data-term="在">zài · 4-й ↘</button><button type="button" data-term="岁">suì · 4-й ↘</button><button type="button" data-term="工程师">gōngchéngshī · 1–2–1</button></div></section>'+
  '<button class="bs393-next" type="button" data-bs-practice>Начать практику ›</button>';
 poster.append(screen1,screen2);
 const change=page=>{screen1.hidden=page!==1;screen2.hidden=page!==2;poster.scrollTop=0;window.scrollTo(0,0);};
 poster.addEventListener('click',e=>{
  if(e.target.closest('[data-bs-next]'))change(2);
  if(e.target.closest('[data-bs-back]'))change(1);
  if(e.target.closest('[data-bs-practice]'))document.getElementById('start')?.click();
 });
 window.addEventListener('pageshow',()=>{if(!document.getElementById('practice')?.hidden)change(1)});
})();