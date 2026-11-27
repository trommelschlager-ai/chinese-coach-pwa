import fs from 'node:fs';
import day from '../assets/panda-street-live-day-v12.mjs';
import night from '../assets/panda-street-live-night-v12.mjs';
const dir='qa/panda-street-browser-v1';
fs.mkdirSync(dir,{recursive:true});
const rig=fs.readFileSync('assets/panda-street-live-personality-v12.mjs','utf8')
 .replace(/^import day[^\n]*\n/m,'').replace(/^import night[^\n]*\n/m,'')
 .replace(/\bexport\s+(?=(?:const|async function)\b)/g,'');
const phrases=['我有点忙。','你晚上有什么计划？','我们聊聊吧！','你好！','你今天怎么样？','你晚上做什么？'];
const clips=phrases.map((zh,i)=>({zh,src:'data:audio/mpeg;base64,'+fs.readFileSync('assets/panda-street-voice-v20261125/'+(21+i)+'.mp3').toString('base64')}));
const source='const day='+JSON.stringify(day)+';const night='+JSON.stringify(night)+';const clips='+JSON.stringify(clips)+';\n'+rig;
const script=`
const stage=document.querySelector('#stage'), status=document.querySelector('#status');
let face, audio, index=0;
const btn=id=>document.getElementById(id);
function stop(){if(audio){audio.pause();audio=null;}face?.setState('idle');btn('play').textContent='▶ Слушать';}
async function play(){if(!face)return;if(audio&&!audio.paused){audio.pause();return;}if(audio&&audio.paused&&!audio.ended){await audio.play();return;}
 const a=new Audio(clips[index].src);audio=a;face.bindAudio(a);
 a.onplaying=()=>{if(audio!==a)return;face.setState('talking');btn('play').textContent='Ⅱ Пауза';};
 a.onpause=()=>{if(audio!==a)return;face.setState('idle');btn('play').textContent='▶ Продолжить';};
 a.onended=()=>{if(audio!==a)return;stop();};
 a.onerror=()=>{status.textContent='Не удалось открыть запись';stop();};
 try{await a.play()}catch{status.textContent='Нажми «Слушать» ещё раз';}
}
btn('theme').onclick=()=>{const d=document.documentElement;d.dataset.theme=d.dataset.theme==='day'?'night':'day';btn('theme').textContent=d.dataset.theme==='day'?'🌙 Ночь':'☀ День';};
btn('play').onclick=play;
btn('next').onclick=()=>{stop();index=(index+1)%clips.length;btn('phrase').textContent=clips[index].zh;};
for(const [id,k] of [['listen','listening'],['correct','correct'],['confused','confused']])btn(id).onclick=()=>{stop();if(k==='listening'){face?.setState(k);setTimeout(()=>{if(face?.getState()==='listening')face.setState('idle')},1800);}else face?.react(k);};
(async()=>{try{face=await createStreetFaceRig({stage,source:btn('source')});new ResizeObserver(()=>face.resize()).observe(stage);status.textContent='Выбери фразу и проверь мимику';for(const b of document.querySelectorAll('button'))b.disabled=false;}catch(e){status.textContent='Анимация не загрузилась: '+e.message;}})();
`;
const html='<!DOCTYPE html><html lang="ru" data-theme="night"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panda Street — тест мимики</title><style>*{box-sizing:border-box}body{margin:0;background:#090d20;color:white;font:14px system-ui,sans-serif;display:flex;flex-direction:column;height:100dvh;overflow:hidden}#stage{position:relative;flex:1;min-height:0;overflow:hidden}#controls{padding:8px;display:grid;gap:6px;background:#171329}#status{font-size:12px;text-align:center;color:#d4c8e9}#phrase{font-size:20px;text-align:center;font-weight:bold}.row{display:flex;gap:5px}button{flex:1;min-height:38px;border-radius:9px;border:1px solid #9376c5;background:#342455;color:white;font:600 13px system-ui;cursor:pointer}button:disabled{opacity:.5}</style></head><body><div id="stage"><span id="source"></span></div><div id="controls"><div id="phrase">'+phrases[0]+'</div><div class="row"><button id="theme" disabled>☀ День</button><button id="play" disabled>▶ Слушать</button><button id="next" disabled>Следующая</button></div><div class="row"><button id="listen" disabled>Слушает</button><button id="correct" disabled>Улыбка</button><button id="confused" disabled>Не понял</button></div><div id="status">Загрузка…</div></div><script type="module">'+source+'\n'+script+'</script></body></html>';
fs.writeFileSync(dir+'/panda-street-motion-demo.html',html);
console.log('Portable exact-artwork motion demo: '+Buffer.byteLength(html)+' bytes');
