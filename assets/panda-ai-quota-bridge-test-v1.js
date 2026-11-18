/* Panda Go: isolated mock quota tester in the authentic Panda AI interface.
   Existing Panda conversation/voice/lessons do not spend the paid-AI quota. */
(function () {
  'use strict';
  const url='https://vswpftgbpietfqasurgo.supabase.co';
  const publishable='sb_publishable_pgjflLkwskANFOx-Dj_FIg_BqAZkSE2';
  let token='';
  const css=document.createElement('style');
  css.textContent=[
    '#pq-fab{position:fixed;z-index:999999;top:12px;right:12px;padding:9px 12px;min-height:42px;border:2px solid #fff;border-radius:99px;background:#6046ac;color:#fff;font:700 13px system-ui;box-shadow:0 5px 20px #21103e55;cursor:pointer}',
    '#pq-modal{box-sizing:border-box;width:min(90vw,370px);max-height:70dvh;overflow:auto;padding:15px;border:1px solid #d9c9f1;border-radius:20px;background:white;color:#302743;font:15px/1.4 system-ui;box-shadow:0 15px 50px #1c103060;z-index:9999999}',
    '#pq-modal::backdrop{background:#120b29ae}',
    '#pq-modal *,#pq-modal *::before,#pq-modal *::after{box-sizing:border-box}',
    '#pq-modal h2{font:750 18px system-ui;margin:0 0 8px}',
    '#pq-modal .pq-note{background:#fff4e0;color:#634a2a;border-radius:11px;padding:9px;font:12px/1.35 system-ui}',
    '#pq-modal label{display:block;margin-top:10px;font:700 13px system-ui}',
    '#pq-modal input,#pq-modal textarea{display:block;width:100%;border:1px solid #cbbadc;border-radius:12px;background:white;color:#302743;padding:10px;font:15px system-ui}',
    '#pq-modal textarea{min-height:80px}',
    '#pq-modal button{padding:10px 12px;border:0;border-radius:12px;background:#6046ac;color:white;font:700 14px system-ui;cursor:pointer;margin:8px 6px 4px 0}',
    '#pq-modal .pq-secondary{background:#ede5f7;color:#503581}',
    '#pq-modal .pq-hidden{display:none!important}',
    '#pq-modal .pq-count{font:800 28px system-ui;margin:7px 0}',
    '#pq-modal .pq-small{font:12px/1.4 system-ui;color:#615875}',
    '#pq-modal .pq-error{color:#ae2434;white-space:pre-wrap}',
    '#pq-modal .pq-answer{white-space:pre-wrap;overflow-wrap:anywhere}',
    '#pq-close{float:right}'
  ].join('');
  document.head.appendChild(css);
  const fab=document.createElement('button');
  fab.type='button';fab.id='pq-fab';fab.textContent='🧪 AI лимит';
  const modal=document.createElement('dialog');
  modal.id='pq-modal';
  modal.innerHTML=[
    '<button type="button" id="pq-close" class="pq-secondary">Закрыть ✕</button>',
    '<h2>🐼 AI-лимит</h2>',
    '<p class="pq-note">🧪 Тест: обычные голосовые диалоги бесплатны. Только «Тестовый ответ» списывает один ответ. Настоящий платный AI не подключён.</p>',
    '<section id="pq-login">',
    '<label for="pq-email">Почта тестового ученика</label><input id="pq-email" type="email" autocomplete="username">',
    '<label for="pq-password">Тестовый пароль</label><input id="pq-password" type="password" autocomplete="current-password">',
    '<button id="pq-signin" type="button">Войти</button>',
    '</section>',
    '<section id="pq-panel" class="pq-hidden">',
    '<button id="pq-signout" type="button" class="pq-secondary">Выйти</button>',
    '<div id="pq-count" class="pq-count">— / —</div><p id="pq-status" class="pq-small"></p>',
    '<button id="pq-refresh" type="button" class="pq-secondary">Обновить лимит</button>',
    '<label for="pq-message">Фраза по-китайски</label><textarea id="pq-message" maxlength="500" placeholder="你好！"></textarea>',
    '<button id="pq-send" type="button">Тестовый ответ</button>',
    '<p id="pq-answer" class="pq-answer" aria-live="polite"></p>',
    '</section>',
    '<p id="pq-error" role="alert" class="pq-error"></p>',
    '<p class="pq-small">Тестовая система Supabase · без списания денег · оригинальная Panda AI не изменена.</p>'
  ].join('');
  document.body.append(fab,modal);
  const get=id=>modal.querySelector('#'+id);
  const err=e=>{get('pq-error').textContent=e||''};
  const reset=()=>{
    token='';get('pq-password').value='';
    get('pq-login').classList.remove('pq-hidden');
    get('pq-panel').classList.add('pq-hidden');
    get('pq-count').textContent='— / —';fab.textContent='🧪 AI лимит';
  };
  async function call(method,message){
    if(!token)throw Error('Сначала войди в тестовый аккаунт');
    const response=await fetch(url+'/functions/v1/panda-ai-pilot',{
      method,
      headers:{'apikey':publishable,'authorization':'Bearer '+token,'content-type':'application/json'},
      ...(message?{body:JSON.stringify({message})}:{})
    });
    const data=await response.json();
    if(!response.ok)throw Error(data.error||('Ошибка '+response.status));
    return data;
  }
  async function refresh(){
    const q=await call('GET');
    get('pq-count').textContent=q.remaining+' / '+q.limit;
    fab.textContent='🐼 AI '+q.remaining+'/'+q.limit;
    get('pq-status').textContent=(q.phase==='trial'?'Расширенный доступ, день '+q.trialDay+' из 30':'Базовый доступ')+
      ' · Сброс '+new Date(q.resetsAt).toLocaleString('ru-RU')+(q.testGrant?' · ТЕСТ':'');
  }
  fab.addEventListener('click',()=>{if(!modal.open){modal.showModal();if(token)refresh().catch(e=>err(e.message||'Ошибка'));}});
  get('pq-close').addEventListener('click',()=>modal.close());
  get('pq-signout').addEventListener('click',()=>{reset();err('')});
  get('pq-signin').addEventListener('click',async()=>{
    err('');
    const email=get('pq-email').value.trim();
    const password=get('pq-password').value;
    if(!email||!password){err('Введи почту и тестовый пароль');return;}
    get('pq-signin').disabled=true;
    try{
      const response=await fetch(url+'/auth/v1/token?grant_type=password',{
        method:'POST',headers:{'apikey':publishable,'content-type':'application/json'},
        body:JSON.stringify({email,password})
      });
      const data=await response.json();
      if(!response.ok||!data.access_token)throw Error(data.error_description||'Не удалось войти');
      token=data.access_token;get('pq-password').value='';
      get('pq-login').classList.add('pq-hidden');
      get('pq-panel').classList.remove('pq-hidden');
      await refresh();
    }catch(e){reset();err(e.message||'Ошибка авторизации')}
    finally{get('pq-signin').disabled=false;}
  });
  get('pq-refresh').addEventListener('click',async()=>{err('');try{await refresh()}catch(e){err(e.message||'Ошибка')}});
  get('pq-send').addEventListener('click',async()=>{
    const message=get('pq-message').value.trim();
    if(!message){err('Напиши фразу');return;}
    get('pq-send').disabled=true;err('');
    try{
      const result=await call('POST',message);
      get('pq-answer').textContent='🐼 '+result.answer+'\n(Имитация, не платный AI)';
      await refresh();
    }catch(e){err(e.message||'Ошибка');try{await refresh()}catch{}}
    finally{get('pq-send').disabled=false;}
  });
  window.addEventListener('pagehide',reset);
})();
