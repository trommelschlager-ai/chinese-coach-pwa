/* Panda Street AI · photo-preserving, localized face motion v2.
 * The approved still image is NEVER replaced, warped, scaled, or moved.
 * Only a transparent face-sized canvas animates the visible mouth and lenses.
 * Audio-driven mouth motion is a visual cue, NOT acoustic lip sync or tone grading.
 */
const FACE={x:206,y:406,width:264,height:190};
// Calibrated against the actual 693 × 1444 Street screenshot, not the
// initial prototype. Earlier y:609 drew a nearly invisible mark below the jaw.
const MOUTH={x:327,y:530};
const LENSES=[
 {x:271,y:454,rx:43,ry:21,angle:-0.11},
 {x:374,y:463,rx:43,ry:24,angle:0.13}
];
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export function streetFacePlacement(layout,x,y){
 const scale=Number(layout?.scale)||1;
 return {x:(Number(layout?.left)||0)+x*scale,
  y:(y-(Number(layout?.cutSky)||0))*scale};
}
export function streetMouthOpenness(level,time=0){
 const loudness=clamp(level);
 return loudness*(0.55+0.45*Math.abs(Math.sin((Number(time)||0)*0.026)));
}
export function createStreetFaceRig({stage,source}={}){
 if(!stage?.appendChild||!source)throw new TypeError('Approved Street stage/photo required');
 const doc=stage.ownerDocument||document;
 const canvas=doc.createElement('canvas');canvas.id='street-face-motion-layer';
 Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',
  zIndex:'1',userSelect:'none',display:'block'});
 canvas.setAttribute('aria-hidden','true');
 canvas.setAttribute('data-motion-state','idle');
 stage.appendChild(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});
 const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 const now=()=>globalThis.performance?.now?.()||Date.now();
 const raf=fn=>globalThis.requestAnimationFrame?.(fn)||0;
 const caf=id=>globalThis.cancelAnimationFrame?.(id);
 let layout={width:0,height:0,scale:1,left:0,cutSky:0};
 let state='idle',level=0,blinkUntil=0,blinkTimer=null;
 let reactStart=0,reactUntil=0,reactFrame=0,destroyed=false;
 function showState(value){canvas.setAttribute('data-motion-state',value)}
 function clear(){
  if(!ctx)return;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
 }
 function render(at=now()){
  if(destroyed||!ctx)return;
  clear();
  if(reduced()||doc.hidden)return;
  if(!layout.width||!layout.height||layout.scale<=0)return;
  // Backing store is ONLY the face region, avoiding a costly full-screen
  // alpha clear on mobile devices and preventing motion of the approved body.
  ctx.setTransform(canvas.width/FACE.width,0,0,canvas.height/FACE.height,0,0);
  ctx.translate(-FACE.x,-FACE.y);
  const reacting=state!=='talking'&&at<reactUntil;
  const phase=reacting?clamp((at-reactStart)/Math.max(1,reactUntil-reactStart)):0;
  const blink=at<blinkUntil;
  if(blink||reacting){
   const intensity=blink?Math.sin(clamp((blinkUntil-at)/250)*Math.PI):
    Math.sin(phase*Math.PI);
   const alpha=(reacting?0.42:0.32)*Math.max(0,intensity);
   // A tiny reflective glint at the real sunglass positions; no eye redraw.
   ctx.fillStyle='rgba(244,230,205,'+alpha.toFixed(3)+')';
   for(const lens of LENSES){
    ctx.beginPath();
    ctx.ellipse(lens.x-12,lens.y-7,8.5,2.1,lens.angle,0,Math.PI*2);
    ctx.fill();
   }
  }
  const openness=state==='talking'?streetMouthOpenness(level,at):
   reacting?0.52*Math.pow(Math.sin(phase*Math.PI*2),2):0;
  if(openness<=0.025)return;
  // A clearly visible, limited lip aperture at the ACTUAL mouth position.
  // Feather the dark interior into the original fur instead of deforming it.
  const aperture=2+openness*9.6;
  ctx.save();
  ctx.translate(MOUTH.x,MOUTH.y);
  ctx.scale(1,Math.max(0.65,aperture/9));
  const shadow=ctx.createRadialGradient(0,1,2,0,1,29);
  shadow.addColorStop(0,'rgba(25,11,14,0.94)');
  shadow.addColorStop(.62,'rgba(29,12,16,0.82)');
  shadow.addColorStop(1,'rgba(38,19,19,0)');
  ctx.fillStyle=shadow;
  ctx.beginPath();ctx.ellipse(0,0,27,7.9,0,0,Math.PI*2);ctx.fill();
  // Lower-lip fur highlight reinforces open/close motion without changing face.
  ctx.fillStyle='rgba(235,190,166,'+(0.12+openness*0.39).toFixed(3)+')';
  ctx.beginPath();ctx.ellipse(0,7.8,19.5,1.45,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
 function queueBlink(){
  clearTimeout(blinkTimer);
  if(destroyed)return;
  blinkTimer=setTimeout(()=>{
   if(!doc.hidden&&state!=='talking'&&!reduced()){
    blinkUntil=now()+250;
    render();
    setTimeout(()=>{if(!destroyed)render()},270);
   }
   queueBlink();
  },4300);
 }
 function resize(next){
  if(destroyed)return;
  layout={width:Number(next?.width)||stage.clientWidth,
   height:Number(next?.height)||stage.clientHeight,
   scale:Number(next?.scale)||1,left:Number(next?.left)||0,
   cutSky:Number(next?.cutSky)||0};
  const {scale,left,cutSky}=layout;
  canvas.style.left=(left+FACE.x*scale)+'px';
  canvas.style.top=((FACE.y-cutSky)*scale)+'px';
  canvas.style.width=(FACE.width*scale)+'px';
  canvas.style.height=(FACE.height*scale)+'px';
  const dpr=Math.min(3,Number(globalThis.devicePixelRatio)||1);
  const bw=Math.max(1,Math.round(FACE.width*scale*dpr));
  const bh=Math.max(1,Math.round(FACE.height*scale*dpr));
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}
  render();
 }
 function setState(next){
  if(destroyed)return;
  state=['idle','listening','talking'].includes(next)?next:'idle';
  if(state!=='talking')level=0;
  if(state==='talking'&&reactFrame){caf(reactFrame);reactFrame=0;reactUntil=0}
  showState(state);
  render();
 }
 function talk(value){
  if(destroyed||state!=='talking')return;
  level=clamp(value);render();
 }
 function reactionTick(){
  reactFrame=0;
  if(destroyed||state==='talking')return;
  const at=now();
  if(at>=reactUntil){
   reactUntil=0;showState(state);render(at);return;
  }
  render(at);
  reactFrame=raf(reactionTick);
 }
 function acknowledge(){
  if(destroyed||state==='talking'||reduced())return;
  if(reactFrame){caf(reactFrame);reactFrame=0}
  reactStart=now();reactUntil=reactStart+950;
  showState('reaction');
  render(reactStart+80);
  reactFrame=raf(reactionTick);
 }
 function destroy(){
  if(destroyed)return;
  destroyed=true;clearTimeout(blinkTimer);
  if(reactFrame)caf(reactFrame);
  canvas.remove();
 }
 resize({});
 queueBlink();
 return Object.freeze({resize,setState,talk,acknowledge,destroy,getState:()=>state});
}
