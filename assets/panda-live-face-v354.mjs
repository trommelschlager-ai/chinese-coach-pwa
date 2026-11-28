/* Panda AI v354 — natural micro-expressions from the approved mascot pixels.
   The original character WebP is never replaced or repainted outside the small
   eye and mouth regions. Any unsupported canvas falls back to the static WebP. */
export function createPandaMouth(mascot, getAudioLevel = null) {
  const picture=mascot.querySelector('.pg346-panda');
  const canvas=mascot.querySelector('.pg353-face-canvas');
  if(!picture||!canvas)return {setTalking(){},react(){},dispose(){}};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let ctx=null,source=null,target=null,raf=0,talking=false,alive=true,ready=false;
  let width=440,height=484,lastTime=0,lastMouth=1,lastBlink=1;
  let nextBlink=performance.now()+4600,blinkStart=-1,blinkCount=0;
  let expression='neutral',reactionStart=0,reactionUntil=0;
  const mouth={cx:.651,cy:.407,inner:.019,outer:.065,radius:.092};
  // Exact original eye locations on the approved transparent panda artwork.
  const eyes=[
    {cx:.451,cy:.326,inner:.023,outer:.058,radius:.070},
    {cx:.675,cy:.288,inner:.023,outer:.058,radius:.064}
  ];
  function warp(v,c,inner,outer,scale){
    const d=Math.abs(v-c);
    if(d>=outer)return v;
    const scaled=inner*scale;
    const sourceDist=d<scaled?d/Math.max(.08,scale):inner+(d-scaled)*(outer-inner)/(outer-scaled);
    return c+Math.sign(v-c)*sourceDist;
  }
  function deform(region,scale){
    if(scale>=.999)return;
    const {cx,cy,inner,outer,radius}=region;
    const x0=Math.max(0,Math.floor((cx-radius)*width)),x1=Math.min(width,Math.ceil((cx+radius)*width));
    const y0=Math.max(0,Math.floor((cy-outer)*height)),y1=Math.min(height,Math.ceil((cy+outer)*height));
    for(let x=x0;x<x1;x++){
      const r=Math.abs(x/width-cx)/radius;
      const k=Math.max(0,Math.min(1,(r-.56)/.44));
      const weight=1-k*k*(3-2*k);
      for(let y=y0;y<y1;y++){
        const v=y/height;
        const srcY=(v+(warp(v,cy,inner,outer,scale)-v)*weight)*height;
        const ya=Math.max(0,Math.min(height-1,Math.floor(srcY))),yb=Math.min(height-1,ya+1),mix=srcY-ya;
        const dest=(y*width+x)*4,a=(ya*width+x)*4,b=(yb*width+x)*4;
        for(let i=0;i<4;i++)target.data[dest+i]=source.data[a+i]*(1-mix)+source.data[b+i]*mix;
      }
    }
  }
  function draw(mouthScale,blinkScale){
    if(!ready)return;
    target.data.set(source.data);
    deform(mouth,mouthScale);
    if(blinkScale<.999)for(const eye of eyes)deform(eye,blinkScale);
    ctx.putImageData(target,0,0);
    mascot.dataset.mouthFrame=String((Number(mascot.dataset.mouthFrame)||0)+1);
  }
  function frame(now){
    if(!alive)return;
    raf=requestAnimationFrame(frame);
    if(document.hidden||!ready||now-lastTime<55)return;
    lastTime=now;
    let blink=1;
    if(!reduced?.matches){
      if(blinkStart<0&&now>=nextBlink){blinkStart=now;blinkCount++;mascot.dataset.blinkCount=String(blinkCount)}
      if(blinkStart>=0){
        const elapsed=now-blinkStart;
        if(elapsed>=260){blinkStart=-1;nextBlink=now+4000+Math.random()*3000;mascot.dataset.eyes='open'}
        else{blink=1-.88*Math.sin(Math.PI*elapsed/260);mascot.dataset.eyes='blinking'}
      }
    }else mascot.dataset.eyes='open';
    if(!reduced?.matches&&expression!=='neutral'){
      if(now>=reactionUntil){expression='neutral';mascot.dataset.expression='neutral';}
      else{
       const pulse=Math.sin(Math.PI*Math.max(0,Math.min(1,(now-reactionStart)/(reactionUntil-reactionStart))));
       blink=Math.min(blink,1-(expression==='positive'?.22:.11)*pulse);
      }
    }
    let scale=1;
    if(talking){
      const sample=typeof getAudioLevel==='function'?Number(getAudioLevel()):NaN;
      const level=Number.isFinite(sample)&&sample>=0
        ?Math.min(1,Math.max(0,sample))
        :.5+.31*Math.sin(now/1000*18)+.19*Math.sin(now/1000*11.8);
      scale=.27+.71*Math.max(0,Math.min(1,level));
      // Never leave a completely frozen mouth when the audio envelope is silent.
      if(level<=.01)scale=.83;
    }
    if(Math.abs(scale-lastMouth)>.025||Math.abs(blink-lastBlink)>.025){
      draw(scale,blink);lastMouth=scale;lastBlink=blink;
    }
  }
  function initialize(){
    if(!alive||ready||!picture.naturalWidth||!picture.naturalHeight)return;
    try{
      width=Math.min(500,Math.max(350,picture.naturalWidth));
      height=Math.round(width*picture.naturalHeight/picture.naturalWidth);
      canvas.width=width;canvas.height=height;
      ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw Error('2D canvas unavailable');
      ctx.drawImage(picture,0,0,width,height);
      source=ctx.getImageData(0,0,width,height);
      target=ctx.createImageData(width,height);
      ready=true;
      draw(1,1);mascot.dataset.faceReady='true';
      mascot.dataset.eyes='open';mascot.dataset.lips='rest';
      raf=requestAnimationFrame(frame);
    }catch(err){
      console.warn('Panda expression canvas unavailable; show original image',err);
      ready=false;mascot.dataset.faceReady='false';canvas.hidden=true;
    }
  }
  if(picture.complete)initialize();else picture.addEventListener('load',initialize,{once:true});
  return {
    setTalking(value){
      const next=!!value;
      if(next===talking)return;
      talking=next;mascot.dataset.lips=next?'moving':'rest';
      if(ready){draw(next?.32:1,1);lastMouth=next?.32:1;lastBlink=1}
    },
    react(value){
      expression=['positive','supportive'].includes(value)&&!reduced?.matches?value:'neutral';
      reactionStart=performance.now();reactionUntil=reactionStart+900;
      mascot.dataset.expression=expression;
    },
    dispose(){alive=false;cancelAnimationFrame(raf);mascot.dataset.lips='rest';mascot.dataset.expression='neutral'}
  };
}
