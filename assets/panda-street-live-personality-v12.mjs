/* Approved Panda Street Live Personality 1.2; isolated scene and UI. */
import day from './panda-street-live-day-v12.mjs';
import night from './panda-street-live-night-v12.mjs';
export const VERSION='1.2';
export async function createStreetFaceRig({stage,source}={}){
 if(!stage?.appendChild||!source)throw new TypeError('Street stage and source required');
 const doc=stage.ownerDocument,W=865,H=1536,assets={};
 if(!globalThis.CSS?.supports('clip-path','path("M0 0 H10 V10 Z")'))throw Error('UI mask unsupported');
 const canvas=doc.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 canvas.width=W;canvas.height=H;
 const screen=doc.createElement('canvas');screen.id='street-face-motion-layer';screen.setAttribute('aria-hidden','true');
 Object.assign(screen.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'0'});
 const sc=screen.getContext('2d',{alpha:false});if(!ctx||!sc)throw Error('Canvas unavailable');
 let theme='night',act='idle',actStart=0,logical=0,last=0,ambient=true,ready=false,glintStart=-1e9,shootStart=-1e9,nextGlint=180000,nextShoot=360000,raf=0,amplitude=0;
 let audio=null,envelope=null,fallback=0,pending=null,state='idle',disposed=false,lastPaint=-1e9,layout={width:0,height:0};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const durations={hello:1500,speak:4500,listen:1900,correct:1500,confused:1500,ack:1200};
 function setAct(a){act=a;actStart=logical;amplitude=0;screen.dataset.motionKind=a;screen.dataset.motionState=a==='speak'?'talking':a==='listen'?'listening':a==='idle'?'idle':'reaction';}
 const cache=new Map();
 function decodeEnvelope(url){
  if(cache.has(url))return cache.get(url);
  const p=(async()=>{const C=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;if(!C)return null;
   const response=await fetch(url);if(!response.ok)return null;
   const ac=new C(1,1,44100),data=await ac.decodeAudioData(await response.arrayBuffer());
   const step=.02,hop=Math.max(1,Math.round(data.sampleRate*step)),count=Math.ceil(data.length/hop),values=new Float32Array(count);
   const chans=Array.from({length:data.numberOfChannels},(_,i)=>data.getChannelData(i));
   for(let j=0;j<count;j++){let total=0,n=0;for(const samples of chans){for(let k=j*hop;k<Math.min(samples.length,(j+1)*hop);k+=2){total+=samples[k]*samples[k];n++}}
    values[j]=Math.sqrt(total/Math.max(1,n));}
   return {step,values};
  })().catch(()=>null);
  cache.set(url,p);if(cache.size>12)cache.delete(cache.keys().next().value);return p;
 }
 function bindAudio(a){audio=a;envelope=null;fallback=0;if(!a?.src)return;
  decodeEnvelope(a.src).then(e=>{if(audio===a)envelope=e;});}
 function speechLevel(){
  if(!audio||audio.paused||audio.ended)return 0;
  if(!envelope)return clamp(fallback,0,1)*.65;
  const pos=audio.currentTime/envelope.step,i=Math.floor(pos),f=pos-i,v=envelope.values;
  const rms=(v[i]||0)*(1-f)+(v[i+1]||0)*f;
  return rms<.025?0:clamp((rms-.022)*6.8,0,1);
 }
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const pulse=u=>Math.sin(Math.PI*clamp(u,0,1))**2;const draw=(key,...args)=>ctx.drawImage(assets[key],...args);function glow(x,y,r,alpha,color){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.24,`rgba(${color},${alpha*.25})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function paint(){if(!ready)return;const t=logical/1000,d=logical-actStart;let current=reduce?'idle':act;const audioPlaying=audio&&!audio.paused&&!audio.ended;if(current!=='idle'&&!(current==='speak'&&audioPlaying)&&d>durations[current]){setAct('idle');current='idle';}ctx.globalAlpha=1;draw(theme,0,0);
// Background itself is never transformed. Only alpha-masked foliage pixels and lighting overlays are animated.
if(ambient&&!reduce){if(theme==='day'){ctx.save();ctx.globalAlpha=.22;draw('day-leaves',Math.sin(t*.8)*1.5,Math.sin(t*.61)*.8);ctx.restore();glow(785,84,100,.045+.022*Math.sin(t*.7),'255,244,179');}else{const stars=[[295,25],[275,84],[359,69],[388,142],[389,281],[504,256],[609,155],[589,220],[465,39]];stars.forEach(([x,y],i)=>{let a=.08+.15*(.5+.5*Math.sin(t*(.65+i*.07)+i*2.7));glow(x,y,i%3===0?10:6,a,'189,214,255')});}}
// Breathing layer is inside the shirt, independent of surroundings and seated silhouette.
let breathing=reduce?0:Math.sin(t*2*Math.PI/6)*.004;ctx.save();ctx.translate(404,792);ctx.scale(1+breathing,1+breathing*1.5);draw(theme+'-chest',-89,-105);ctx.restore();
let angle=0,sy=1,dy=0,mouth=0,smile=false;const u=clamp(d/(durations[current]||1),0,1),p=pulse(u);if(current==='hello'){dy=1.0*p;sy=1-.005*p;angle=.0025*p;}if(current==='listen'){angle=-.038*p;dy=1.2*p;}if(current==='correct'){angle=.004*p;dy=.9*p;sy=1-.004*p;smile=p>.14;}if(current==='confused'){angle=.045*p;dy=-.8*p;}if(current==='ack'){angle=.006*p;dy=2*p;}if(current==='speak'){let target=audioPlaying?speechLevel():0;amplitude+=(target-amplitude)*(target>amplitude?.42:.28);mouth=clamp(amplitude*12,0,12);}else amplitude=0;
// Head is a separate alpha sprite. The stationary backing is only drawn when needed.
const moving=Math.abs(angle)>.0005||Math.abs(dy)>.05||Math.abs(sy-1)>.0005||smile;
if(moving){draw(theme+'-under',190,420);ctx.save();ctx.translate(370,678+dy);ctx.rotate(angle);ctx.scale(1,sy);draw(smile?theme+'-smile':theme+'-head-0',-180,-258);ctx.restore();}
if(current==='speak'&&mouth>.025){const lo=Math.floor(mouth),hi=Math.min(12,lo+1),f=mouth-lo;ctx.save();if(lo>0){ctx.globalAlpha=1;draw(theme+'-jaw-'+lo,286,604);}if(hi>lo){ctx.globalAlpha=f;draw(theme+'-jaw-'+hi,286,604);}ctx.restore();}
// Glint is clipped to the two lenses; no effect on skin or surroundings.
if(ambient&&!reduce&&logical>=nextGlint){glintStart=logical;nextGlint=logical+180000;}
let g=(logical-glintStart)/850;if(g>=0&&g<=1){ctx.save();ctx.translate(370,678+dy);ctx.rotate(angle);ctx.scale(1,sy);ctx.translate(-370,-678);ctx.beginPath();ctx.ellipse(327,563,44,21,.14,0,Math.PI*2);ctx.ellipse(423,580,36,19,.14,0,Math.PI*2);ctx.clip();ctx.translate(302+g*171,571);ctx.rotate(.55);let grad=ctx.createLinearGradient(-14,0,14,0);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.5,`rgba(218,235,255,${.16*pulse(g)})`);grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(-14,-80,28,160);ctx.restore();}
if(ambient&&!reduce&&theme==='night'&&logical>=nextShoot){shootStart=logical;nextShoot=logical+300000+Math.random()*180000;}
let sh=(logical-shootStart)/1000;if(theme==='night'&&sh>=0&&sh<=1){const x=560-sh*147,y=60+sh*96,a=.52*pulse(sh);let grad=ctx.createLinearGradient(x+60,y-38,x,y);grad.addColorStop(0,'rgba(170,205,255,0)');grad.addColorStop(1,`rgba(220,237,255,${a})`);ctx.strokeStyle=grad;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+60,y-38);ctx.lineTo(x,y);ctx.stroke();glow(x,y,5,a,'220,237,255');}}

 const old=[doc.getElementById('art'),doc.getElementById('day-art')].filter(Boolean);
 function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);return `M${x+r} ${y} H${x+w-r} Q${x+w} ${y} ${x+w} ${y+r} V${y+h-r} Q${x+w} ${y+h} ${x+w-r} ${y+h} H${x+r} Q${x} ${y+h} ${x} ${y+h-r} V${y+r} Q${x} ${y} ${x+r} ${y} Z`;}
 function maskUI(){
  if(!ready||!layout.width)return;
  const {width:w,scale:s=1}=layout;
  let paths=[rr(0,0,w,70*s,0)];
  for(const id of ['short','nonstop','row1','row2','game','topics','book','send','mic','home','lessons','trainer','chat','profile']){
   const b=doc.getElementById(id);if(!b)continue;const x=parseFloat(b.style.left),y=parseFloat(b.style.top),bw=parseFloat(b.style.width),bh=parseFloat(b.style.height);
   if(![x,y,bw,bh].every(Number.isFinite)||bw<=0||bh<=0)continue;
   const nav=['home','lessons','trainer','chat','profile'].includes(id);
   paths.push(rr(x,y,bw,bh,nav?10*s:Math.min(bw,bh)*.48));
  }
  for(const a of old){a.style.zIndex='1';a.style.clipPath='path("'+paths.join(' ')+'")';}
 }
 function present(){
  const {width:w,height:h}=layout;if(!w||!h)return;
  const fit=Math.min(w/W,h/H),dw=W*fit,dh=H*fit,x=(w-dw)/2,extra=h-dh,y=extra*.2;
  sc.setTransform(screen.width/w,0,0,screen.height/h,0,0);
  sc.fillStyle=theme==='day'?'#dce6f1':'#080f2b';sc.fillRect(0,0,w,h);
  if(y>0){const sh=Math.min(H,Math.ceil(y/fit));sc.save();sc.translate(x,y);sc.scale(1,-1);sc.drawImage(canvas,0,0,W,sh,0,0,dw,y);sc.restore();}
  sc.drawImage(canvas,x,y,dw,dh);
  const bottom=h-y-dh;if(bottom>0){const sh=Math.min(H,Math.ceil(bottom/fit));sc.save();sc.translate(x,y+dh);sc.scale(1,-1);sc.drawImage(canvas,0,H-sh,W,sh,0,-bottom,dw,bottom);sc.restore();}
 }
 function resize(next={}){if(disposed)return;layout={...next,width:next.width||stage.clientWidth,height:next.height||stage.clientHeight};
  const dpr=Math.min(2,globalThis.devicePixelRatio||1);screen.width=Math.max(1,Math.round(layout.width*dpr));screen.height=Math.max(1,Math.round(layout.height*dpr));maskUI();paint();present();}
 function setState(next){state=['idle','listening','talking'].includes(next)?next:'idle';
  if(state==='talking'){setAct('speak');return;}
  if(state==='listening'){pending=null;setAct('listen');return;}
  fallback=0;const reaction=pending;pending=null;setAct(reaction||'idle');
 }
 function react(next){if(!['hello','correct','confused'].includes(next)||reduce)return;
  if(state==='talking'||(audio&&!audio.paused&&!audio.ended)){pending=next;return;}
  setAct(next);
 }
 function talk(value){fallback=clamp(Number(value)||0,0,1);}
 function acknowledge(){/* A silent acknowledgement is neutral, never a correctness judgement. */if(!reduce&&state!=='talking')setAct('ack');}
 function tick(now){if(disposed)return;if(!last)last=now;
  const dt=Math.min(50,now-last);last=now;
  if(!doc.hidden){logical+=dt;if(now-lastPaint>=32){lastPaint=now;
   const t=doc.documentElement.dataset.theme==='day'?'day':'night';if(t!==theme)theme=t;paint();present();}}
  raf=requestAnimationFrame(tick);
 }
 function destroy(){disposed=true;cancelAnimationFrame(raf);screen.remove();for(const a of old){a.style.clipPath='';a.style.zIndex='';}delete stage.dataset.streetLiveVersion;}
 await Promise.all(Object.entries({...day,...night}).map(([k,src])=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{assets[k]=i;resolve()};i.onerror=()=>reject(Error('Street sprite '+k));i.src=src;})));
 stage.insertBefore(screen,source);ready=true;stage.dataset.streetLiveVersion=VERSION;
 theme=doc.documentElement.dataset.theme==='day'?'day':'night';
 resize();setAct(reduce?'idle':'hello');raf=requestAnimationFrame(tick);
 return Object.freeze({resize,setState,talk,acknowledge,react,bindAudio,destroy,getState:()=>state});
}
