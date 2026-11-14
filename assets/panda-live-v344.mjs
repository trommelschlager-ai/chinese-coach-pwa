const photo=document.querySelector('#pg-approved-v337 .v341-photo');
if(photo&&!photo.dataset.v344){
 photo.dataset.v344='true';
 const original=photo.querySelector('.v341-photo-image');
 for(const type of ['mountains','bridge']){
  const img=original.cloneNode();img.className='v344-scenery '+type;img.alt='';img.setAttribute('aria-hidden','true');photo.insertBefore(img,original);
 }
}
// Create a source-pixel-exact transparent mascot at runtime. The illustration is
// not stretched, regenerated or replaced; we remove only baked UI outside it.
async function isolateApprovedPanda(){
 const img=photo?.querySelector('.v341-photo-image');if(!img)return;
 if(!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})});
 if(!img.naturalWidth)return;

 const sourceBridge=document.createElement('canvas');sourceBridge.width=241;sourceBridge.height=127;
 const bridgeCtx=sourceBridge.getContext('2d');bridgeCtx.drawImage(img,700,1008,241,127,0,0,241,127);
 bridgeCtx.globalCompositeOperation='destination-in';
 const edgeX=bridgeCtx.createLinearGradient(0,0,241,0);edgeX.addColorStop(0,'#0000');edgeX.addColorStop(.06,'#000');edgeX.addColorStop(.96,'#000');edgeX.addColorStop(1,'#0000');bridgeCtx.fillStyle=edgeX;bridgeCtx.fillRect(0,0,241,127);
 const edgeY=bridgeCtx.createLinearGradient(0,0,0,127);edgeY.addColorStop(0,'#0000');edgeY.addColorStop(.08,'#000');edgeY.addColorStop(.90,'#000');edgeY.addColorStop(1,'#0000');bridgeCtx.fillStyle=edgeY;bridgeCtx.fillRect(0,0,241,127);
 const scenicBridge=document.createElement('img');scenicBridge.className='v344-bridge-native';scenicBridge.alt='';scenicBridge.setAttribute('aria-hidden','true');scenicBridge.src=sourceBridge.toDataURL('image/webp',.93);photo.append(scenicBridge);
 const w=img.naturalWidth,h=img.naturalHeight;
 const image=document.createElement('canvas');image.width=w;image.height=h;
 const ctx=image.getContext('2d');ctx.drawImage(img,0,0,w,h);
 const mask=document.createElement('canvas');mask.width=w;mask.height=h;
 const m=mask.getContext('2d');m.fillStyle='#fff';m.beginPath();
 const polygon=[[.37,.34],[.43,.333],[.475,.342],[.507,.368],[.515,.392],[.545,.42],[.562,.45],[.583,.498],[.596,.54],[.567,.575],[.539,.59],[.54,.61],[.56,.66],[.59,.691],[.565,.698],[.505,.698],[.46,.695],[.40,.698],[.30,.698],[.24,.695],[.17,.698],[.133,.685],[.135,.64],[.115,.615],[.112,.573],[.092,.55],[.081,.516],[.085,.482],[.076,.45],[.074,.42],[.08,.404],[.112,.39],[.158,.39],[.20,.394],[.23,.37],[.28,.35],[.32,.345]];
 for(let i=0;i<polygon.length;i++){const [x,y]=polygon[i];if(i)m.lineTo(x*w,y*h);else m.moveTo(x*w,y*h)}m.closePath();m.fill();m.clearRect(w*.497,h*.594,w*.28,h*.059);
 ctx.globalCompositeOperation='destination-in';ctx.filter='blur(4px)';ctx.drawImage(mask,0,0);ctx.filter='none';
 img.src=image.toDataURL('image/webp',.9);img.classList.add('v344-isolated');
}
if(photo)isolateApprovedPanda();
