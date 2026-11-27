// Panda Street Live Personality V1.2 — exact approved demo sprites and motion.
// Existing chat, navigation and playback remain the responsibility of the host.
import spriteSources from './panda-street-live-v12/sprites.mjs';
const sources={...spriteSources,day:new URL('./panda-street-live-v12/day.webp',import.meta.url).href,night:new URL('./panda-street-live-v12/night.webp',import.meta.url).href};
export async function createStreetLiveV12({stage}){
 const doc=stage.ownerDocument,win=doc.defaultView;
 const canvas=doc.createElement('canvas');canvas.id='street-face-motion-layer';canvas.width=865;canvas.height=1536;canvas.setAttribute('aria-hidden','true');canvas.setAttribute('data-motion-state','idle');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',background:'#030513',zIndex:'1',pointerEvents:'none'});
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas unavailable');
 const assets={};await Promise.all(Object.entries(sources).map(([k,src])=>new Promise((resolve,reject)=>{const i=new win.Image();i.onload=()=>{assets[k]=i;resolve()};i.onerror=()=>reject(Error('Street V1.2 asset: '+k));i.src=src;})));
 let theme='night',act='idle',actStart=0,logical=0,last=0,ready=true,ambient=true,reduce=win.matchMedia('(prefers-reduced-motion: reduce)').matches,amplitude=0,level=0,audio=null,envelope=null,raf=0,destroyed=false,lastPaint=-1e9,glintStart=-1e9,shootStart=-1e9,nextGlint=180000,nextShoot=360000;
 const durations={hello:1500,listen:1900,correct:1500,confused:1500};let state='idle';
 const setAct=a=>{act=a;actStart=logical;amplitude=0;canvas.setAttribute('data-motion-state',a==='speak'?'talking':a==='listen'?'listening':a==='correct'?'reaction':a);};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const pulse=u=>Math.sin(Math.PI*clamp(u,0,1))**2;const draw=(key,...args)=>ctx.drawImage(assets[key],...args);function glow(x,y,r,alpha,color){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.24,`rgba(${color},${alpha*.25})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function paint(){if(!ready)return;const t=logical/1000,d=logical-actStart;let current=act;const audioPlaying=act==='speak';if(current!=='idle'&&current!=='speak'&&d>durations[current]){setAct('idle');current='idle';}ctx.globalAlpha=1;draw(theme,0,0);if(reduce)return;
// Background itself is never transformed. Only alpha-masked foliage pixels and lighting overlays are animated.
if(ambient&&!reduce){if(theme==='day'){ctx.save();ctx.globalAlpha=.22;draw('day-leaves',Math.sin(t*.8)*1.5,Math.sin(t*.61)*.8);ctx.restore();glow(785,84,100,.045+.022*Math.sin(t*.7),'255,244,179');}else{const stars=[[295,25],[275,84],[359,69],[388,142],[389,281],[504,256],[609,155],[589,220],[465,39]];stars.forEach(([x,y],i)=>{let a=.08+.15*(.5+.5*Math.sin(t*(.65+i*.07)+i*2.7));glow(x,y,i%3===0?10:6,a,'189,214,255')});}}
// Breathing layer is inside the shirt, independent of surroundings and seated silhouette.
let breathing=reduce?0:Math.sin(t*2*Math.PI/6)*.004;ctx.save();ctx.translate(404,792);ctx.scale(1+breathing,1+breathing*1.5);draw(theme+'-chest',-89,-105);ctx.restore();
let angle=0,sy=1,dy=0,mouth=0,smile=false;const u=clamp(d/(durations[current]||1),0,1),p=pulse(u);if(current==='hello'){dy=1.0*p;sy=1-.005*p;angle=.0025*p;}if(current==='listen'){angle=-.038*p;dy=1.2*p;}if(current==='correct'){angle=.004*p;dy=.9*p;sy=1-.004*p;smile=p>.14;}if(current==='confused'){angle=.045*p;dy=-.8*p;}if(current==='speak'){let target=clamp(level,0,1);if(envelope&&audio&&!audio.paused&&!audio.ended){const rms=envelope[Math.min(envelope.length-1,Math.floor(audio.currentTime*50))]||0;target=rms<.025?0:clamp((rms-.022)*6.8,0,1);}amplitude+=(target-amplitude)*(target>amplitude?.42:.28);mouth=clamp(amplitude*12,0,12);}else amplitude=0;
// Head is a separate alpha sprite. The stationary backing is only drawn when needed.
const moving=Math.abs(angle)>.0005||Math.abs(dy)>.05||Math.abs(sy-1)>.0005||smile;
if(moving){draw(theme+'-under',190,420);ctx.save();ctx.translate(370,678+dy);ctx.rotate(angle);ctx.scale(1,sy);draw(smile?theme+'-smile':theme+'-head-0',-180,-258);ctx.restore();}
if(current==='speak'&&mouth>.025){const lo=Math.floor(mouth),hi=Math.min(12,lo+1),f=mouth-lo;ctx.save();if(lo>0){ctx.globalAlpha=1;draw(theme+'-jaw-'+lo,286,604);}if(hi>lo){ctx.globalAlpha=f;draw(theme+'-jaw-'+hi,286,604);}ctx.restore();}
// Glint is clipped to the two lenses; no effect on skin or surroundings.
if(ambient&&logical>=nextGlint){glintStart=logical;nextGlint=logical+180000;}
let g=(logical-glintStart)/850;if(g>=0&&g<=1){ctx.save();ctx.translate(370,678+dy);ctx.rotate(angle);ctx.scale(1,sy);ctx.translate(-370,-678);ctx.beginPath();ctx.ellipse(327,563,44,21,.14,0,Math.PI*2);ctx.ellipse(423,580,36,19,.14,0,Math.PI*2);ctx.clip();ctx.translate(302+g*171,571);ctx.rotate(.55);let grad=ctx.createLinearGradient(-14,0,14,0);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.5,`rgba(218,235,255,${.16*pulse(g)})`);grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(-14,-80,28,160);ctx.restore();}
if(ambient&&theme==='night'&&logical>=nextShoot){shootStart=logical;nextShoot=logical+300000+Math.random()*180000;}
let sh=(logical-shootStart)/1000;if(theme==='night'&&sh>=0&&sh<=1){const x=560-sh*147,y=60+sh*96,a=.52*pulse(sh);let grad=ctx.createLinearGradient(x+60,y-38,x,y);grad.addColorStop(0,'rgba(170,205,255,0)');grad.addColorStop(1,`rgba(220,237,255,${a})`);ctx.strokeStyle=grad;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+60,y-38);ctx.lineTo(x,y);ctx.stroke();glow(x,y,5,a,'220,237,255');}}
 function tick(now){if(destroyed)return;let dt=last?Math.min(50,now-last):0;last=now;if(!doc.hidden){logical+=dt;if(now-lastPaint>=33){theme=doc.documentElement.dataset.theme==='day'?'day':'night';paint();lastPaint=now;}}raf=win.requestAnimationFrame(tick);}
 function resize(){theme=doc.documentElement.dataset.theme==='day'?'day':'night';paint();}
 function setState(next){state=next;if(next==='talking')setAct('speak');else if(next==='listening')setAct('listen');else{level=0;setAct('idle');}paint();}
 function talk(value){if(act==='speak')level=clamp(Number(value)||0,0,1);}
 function acknowledge(){if(act!=='speak')setAct('correct');}
 function confused(){if(act!=='speak')setAct('confused');}
 function greet(){if(act!=='speak')setAct('hello');}
 // Decode a copy of the exact approved recording, without modifying its playback
 // graph, speed or volume. RMS is a visual approximation, not phoneme lip-sync.
 async function bindAudio(element){audio=element;envelope=null;const AudioContext=win.AudioContext||win.webkitAudioContext;if(!AudioContext)return;let ac;try{const u=new URL(element.src,doc.baseURI);if(u.origin!==win.location.origin)return;const response=await win.fetch(u.href);if(!response.ok)return;const bytes=await response.arrayBuffer();ac=new AudioContext();const buffer=await ac.decodeAudioData(bytes);const samples=buffer.getChannelData(0),step=Math.max(1,Math.round(buffer.sampleRate/50)),out=new Float32Array(Math.ceil(samples.length/step));for(let i=0;i<out.length;i++){let sum=0,count=0;for(let j=i*step;j<Math.min(samples.length,(i+1)*step);j++){sum+=samples[j]*samples[j];count++;}out[i]=Math.sqrt(sum/Math.max(1,count));}if(audio===element&&!destroyed)envelope=out;}catch(_e){/* fallback to existing timing cue */}finally{if(ac)ac.close().catch(()=>{});}}
 function destroy(){destroyed=true;win.cancelAnimationFrame(raf);canvas.remove();stage.classList.remove('street-live-v12');}
 stage.appendChild(canvas);stage.classList.add('street-live-v12');resize();raf=win.requestAnimationFrame(tick);
 return Object.freeze({resize,setState,talk,acknowledge,confused,greet,bindAudio,destroy,getState:()=>state});
}
