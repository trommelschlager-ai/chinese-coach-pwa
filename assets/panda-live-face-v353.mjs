/* Exact-pixel mouth movement for the already approved Panda mascot.
   No new character or altered eyes: pixels are sampled only from the original PNG/WebP.
   CSS image remains the fallback if canvas is unavailable. */
export function createPandaMouth(mascot){
  const picture=mascot.querySelector('.pg346-panda');
  const canvas=mascot.querySelector('.pg353-face-canvas');
  if(!picture||!canvas)return {setTalking() {},dispose() {}};
  let ctx=null,original=null,output=null,raf=0,alive=true,talking=false,last=0,lastScale=1,active=false;
  let width=440,height=470;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const mouth={cx:.651,cy:.407,inner:.019,outer:.065,radius:.092};

  function warp(y,center,inner,outer,scale){
    const d=Math.abs(y-center);
    if(d>=outer)return y;
    const target=inner*scale;
    const sourceDist=d<target?d/scale:inner+(d-target)*(outer-inner)/(outer-target);
    return center+Math.sign(y-center)*sourceDist;
  }
  function paintMouth(scale){
    if(!ctx||!original||!output)return;
    output.data.set(original.data);
    // Narrow-open-mouth motion: compress the original dark/pink inner-mouth pixels
    // vertically while feathering the correction into the untouched cheeks.
    const {cx,cy,inner,outer,radius}=mouth;
    const left=Math.max(0,Math.floor((cx-radius)*width));
    const right=Math.min(width,Math.ceil((cx+radius)*width));
    const top=Math.max(0,Math.floor((cy-outer)*height));
    const bottom=Math.min(height,Math.ceil((cy+outer)*height));
    for(let x=left;x<right;x++){
      const d=Math.abs(x/width-cx)/radius;
      const edge=Math.max(0,Math.min(1,(d-.52)/.48));
      const weight=1-edge*edge*(3-2*edge);
      for(let y=top;y<bottom;y++){
        const fy=y/height;
        const sourceY=(fy+(warp(fy,cy,inner,outer,scale)-fy)*weight)*height;
        const aY=Math.max(0,Math.min(height-1,Math.floor(sourceY)));
        const bY=Math.min(height-1,aY+1);
        const t=Math.max(0,Math.min(1,sourceY-aY));
        const dst=(y*width+x)*4,a=(aY*width+x)*4,b=(bY*width+x)*4;
        for(let k=0;k<4;k++)output.data[dst+k]=original.data[a+k]*(1-t)+original.data[b+k]*t;
      }
    }
    ctx.putImageData(output,0,0);
  }
  function tick(now){
    if(!alive)return;
    raf=requestAnimationFrame(tick);
    if(document.hidden||!ctx||now-last<70)return;
    last=now;
    if(!talking){
      if(lastScale!==1){paintMouth(1);lastScale=1}
      return;
    }
    // Slower and subtler under reduced motion; never turn actual speech off.
    const seconds=now/1000;
    const motion=reduced?.matches?.() ? .5+.5*Math.sin(seconds*11) :
      .5+.29*Math.sin(seconds*19)+.21*Math.sin(seconds*12.3);
    const scale=.20+.78*Math.max(0,Math.min(1,motion));
    if(Math.abs(scale-lastScale)>.035){paintMouth(scale);lastScale=scale}
  }
  function load(){
    if(!alive||active||!picture.naturalWidth||!picture.naturalHeight)return;
    try{
      width=Math.min(500,Math.max(350,picture.naturalWidth));
      height=Math.round(width*picture.naturalHeight/picture.naturalWidth);
      canvas.width=width;canvas.height=height;
      ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw Error('canvas 2d unavailable');
      ctx.clearRect(0,0,width,height);
      ctx.drawImage(picture,0,0,width,height);
      original=ctx.getImageData(0,0,width,height);
      output=ctx.createImageData(width,height);
      output.data.set(original.data);
      ctx.putImageData(output,0,0);
      active=true;mascot.dataset.faceReady='true';
      raf=requestAnimationFrame(tick);
    }catch(err){
      console.warn('Panda face stays static; canvas unavailable',err);
      active=false;mascot.dataset.faceReady='false';canvas.hidden=true;
    }
  }
  if(picture.complete)load();else picture.addEventListener('load',load,{once:true});
  return {
    setTalking(value){talking=Boolean(value);if(!talking&&active&&lastScale!==1){paintMouth(1);lastScale=1}},
    dispose(){alive=false;cancelAnimationFrame(raf)}
  };
}
