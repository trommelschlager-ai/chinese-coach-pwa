/* Panda Street AI · photo-preserving face rig v1.
 * Draws only a small transparent transient animation over the exact approved
 * existing picture: subtle mouth motion during approved male audio and a
 * subdued lens blink, because the panda wears opaque sunglasses.
 * No generated artwork, no altered base picture, no system speech synthesis.
 */
const MOUTH={x:318,y:609};
const LENSES=[
 {x:271,y:537,rx:43,ry:21,angle:-0.11},
 {x:371,y:549,rx:41,ry:24,angle:0.13}
];
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export function streetFacePlacement(layout,x,y){
 const scale=Number(layout?.scale)||1;
 return {x:(Number(layout?.left)||0)+x*scale,
  y:(y-(Number(layout?.cutSky)||0))*scale};
}
export function streetMouthOpenness(level,time=0){
 const loudness=clamp(level);
 // Small dynamic aperture: at rest the original approved image is untouched.
 return loudness*(0.55+0.45*Math.abs(Math.sin((Number(time)||0)*0.026)));
}
export function createStreetFaceRig({stage,source}={}){
 if(!stage?.appendChild||!source)throw new TypeError('Approved Street stage/photo required');
 const doc=stage.ownerDocument||document;
 const canvas=doc.createElement('canvas');canvas.id='street-face-motion-layer';
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',
  pointerEvents:'none',zIndex:'1',userSelect:'none'});
 canvas.setAttribute('aria-hidden','true');
 stage.appendChild(canvas);
 const context=canvas.getContext('2d',{alpha:true});
 const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 let layout={width:0,height:0,scale:1,left:0,cutSky:0};
 let state='idle',level=0,frame=0,nextBlink=0,blinkUntil=0,blinkTimer=null,destroyed=false;
 const now=()=>globalThis.performance?.now?.()||Date.now();
 function clear(){
  if(!context)return;
  const {width,height}=layout;
  if(!width||!height)return;
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
 }
 function render(at=now()){
  if(destroyed||!context)return;
  clear();
  if(reduced()||doc.hidden)return;
  const {width,height,scale,left,cutSky}=layout;
  if(!width||!height||scale<=0)return;
  // The original approved photo is painted by the existing main canvas.
  // This independent transparent layer never draws or replaces the photo.
  context.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  context.translate(left,-cutSky*scale);context.scale(scale,scale);
  if(blinkUntil>at){
   const phase=clamp((blinkUntil-at)/170);
   const opacity=0.13*Math.sin(phase*Math.PI);
   context.fillStyle='rgba(5,4,12,'+opacity.toFixed(3)+')';
   for(const lens of LENSES){
    context.beginPath();
    context.ellipse(lens.x,lens.y,lens.rx,lens.ry,lens.angle,0,Math.PI*2);
    context.fill();
   }
  }
  if(state==='talking'&&level>0.03){
   const openness=streetMouthOpenness(level,at);
   // Restrict lip movement to the small muzzle area below the black nose.
   // Slight translucent shadow suggests opening without deforming the face.
   context.save();
   context.translate(MOUTH.x,MOUTH.y);
   context.scale(1,Math.max(.2,openness));
   const shade=context.createRadialGradient(0,0,1,0,0,14);
   shade.addColorStop(0,'rgba(29,13,15,0.66)');
   shade.addColorStop(.67,'rgba(43,20,19,0.45)');
   shade.addColorStop(1,'rgba(48,26,25,0)');
   context.fillStyle=shade;
   context.beginPath();context.ellipse(0,0,14,5.5,0,0,Math.PI*2);context.fill();
   context.restore();
  }
 }
 function queueBlink(){
  clearTimeout(blinkTimer);
  if(destroyed)return;
  blinkTimer=setTimeout(()=>{
   if(!doc.hidden&&state!=='talking'&&!reduced()){
    blinkUntil=now()+170;
    render();
    setTimeout(()=>{if(!destroyed)render()},180);
   }
   queueBlink();
  },5800);
 }
 function resize(next){
  if(destroyed)return;
  layout={width:Number(next?.width)||stage.clientWidth,height:Number(next?.height)||stage.clientHeight,
   scale:Number(next?.scale)||1,left:Number(next?.left)||0,cutSky:Number(next?.cutSky)||0};
  const dpr=Math.min(3,Number(globalThis.devicePixelRatio)||1);
  const bw=Math.max(1,Math.round(layout.width*dpr)),bh=Math.max(1,Math.round(layout.height*dpr));
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}
  render();
 }
 function setState(next){
  if(destroyed)return;
  state=['idle','listening','talking'].includes(next)?next:'idle';
  if(state!=='talking')level=0;
  render();
 }
 function talk(value){
  if(destroyed||state!=='talking')return;
  level=clamp(value);render();
 }
 function destroy(){
  if(destroyed)return;
  destroyed=true;clearTimeout(blinkTimer);
  canvas.remove();
 }
 resize({});
 queueBlink();
 return Object.freeze({resize,setState,talk,destroy,getState:()=>state});
}
