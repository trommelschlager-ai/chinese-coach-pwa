// Original uploaded pixels only. Bounded vertical texture compression makes a
// blink and mouth motion without replacement artwork or cutting out body parts.
export function createPandaRig(character,canvas){
 const picture=character.querySelector('img');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let ctx,source,output,frame=0,level=0,talking=false,disposed=false,lastDraw=0,lastMouth=-1,lastBlink=-1;
 const width=448,height=560;
 function warp(y,c,inner,outer,scale){
  const distance=Math.abs(y-c);if(distance>=outer)return y;
  const target=inner*scale;
  const value=distance<target?distance/scale:inner+(distance-target)*(outer-inner)/(outer-target);
  return c+Math.sign(y-c)*value;
 }
 function compress(cx,cy,inner,outer,radius,scale){
  if(scale>.999)return;
  const left=Math.max(0,Math.floor((cx-radius)*width)),right=Math.min(width,Math.ceil((cx+radius)*width));
  const top=Math.max(0,Math.floor((cy-outer)*height)),bottom=Math.min(height,Math.ceil((cy+outer)*height));
  for(let x=left;x<right;x++){
   const distance=Math.abs(x/width-cx)/radius;
   const t=Math.max(0,Math.min(1,(distance-.5)/.5));const weight=1-t*t*(3-2*t);
   for(let y=top;y<bottom;y++){
    const mapped=(y/height+(warp(y/height,cy,inner,outer,scale)-y/height)*weight)*height;
    const y1=Math.max(0,Math.min(height-1,Math.floor(mapped))),y2=Math.min(height-1,y1+1),mix=mapped-y1;
    const target=(y*width+x)*4,a=(y1*width+x)*4,b=(y2*width+x)*4;
    for(let ch=0;ch<4;ch++)output.data[target+ch]=source.data[a+ch]*(1-mix)+source.data[b+ch]*mix;
   }
  }
 }
 function draw(now){
  if(disposed)return;
  frame=window.requestAnimationFrame(draw);
  if(document.hidden||now-lastDraw<33)return;lastDraw=now;
  const phase=(now%6800)/6800;
  const blink=reduced?.matches?1:phase>.94?1-.91*Math.sin((phase-.94)/.06*Math.PI):1;
  const mouth=talking&&!reduced?.matches? .22+.78*level:1;
  if(Math.abs(mouth-lastMouth)<.008&&Math.abs(blink-lastBlink)<.008)return;
  lastMouth=mouth;lastBlink=blink;output.data.set(source.data);
  compress(.424,.398,.032,.075,.094,mouth);
  compress(.322,.292,.025,.058,.078,blink);
  ctx.putImageData(output,0,0);
 }
 function setup(){
  if(disposed||ctx||!picture.naturalWidth)return;
  try{
   ctx=canvas.getContext('2d');if(!ctx)return;
   canvas.width=width;canvas.height=height;
   ctx.drawImage(picture,0,0,width,height);source=ctx.getImageData(0,0,width,height);output=ctx.createImageData(width,height);
   canvas.hidden=false;picture.style.opacity='0';frame=window.requestAnimationFrame(draw);
  }catch(error){console.warn('Panda canvas fallback:',error?.message);canvas.hidden=true;picture.style.opacity='1'}
 }
 if(picture.complete)setup();else picture.addEventListener('load',setup,{once:true});
 return {
  setState(value){character.dataset.state=value;talking=value==='talking'},
  setLevel(value){level=Math.max(0,Math.min(1,value))},
  dispose(){disposed=true;window.cancelAnimationFrame(frame)}
 };
}
