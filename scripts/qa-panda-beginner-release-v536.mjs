import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-beginner-release',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,393,412]){
  const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.pandaStatic==='true',{timeout:15000});
  const visibility=await page.evaluate(()=>{
    const stage=document.querySelector('#pg346');
    const original=stage.querySelector('.pg346-scene .pg352-mascot');
    const panda=stage.querySelector('.pg542-frozen-panda');
    const cs=getComputedStyle(panda),r=panda.getBoundingClientRect();
    const cv=document.createElement('canvas');cv.width=40;cv.height=40;
    const ctx=cv.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(panda,0,0,40,40);
    const data=ctx.getImageData(0,0,40,40).data;
    let visiblePixels=0;for(let i=3;i<data.length;i+=4)if(data[i]>90)visiblePixels++;
    return {originalStillInScene:!!original,pandaLoaded:panda.complete&&panda.naturalWidth>100,
      display:cs.display,visibility:cs.visibility,opacity:cs.opacity,
      bounds:{x:r.x,y:r.y,w:r.width,h:r.height},visiblePixels};
  });
  assert(visibility.originalStillInScene,'Original Panda must remain in scenic DOM for audio/face callbacks');
  assert(visibility.pandaLoaded,'Frozen Panda image is NOT loaded');
  assert.equal(visibility.display,'block','Panda clone is hidden by CSS');
  assert.equal(visibility.visibility,'visible','Panda clone is invisible');
  assert(visibility.bounds.w>90&&visibility.bounds.h>90,'Panda portrait has no visible size: '+JSON.stringify(visibility));
  assert(visibility.visiblePixels>60,'Panda portrait appears transparent/empty: '+JSON.stringify(visibility));

  const portrait=async()=>page.evaluate(()=>{
   const panda=document.querySelector('#pg346 .pg542-static-layer .pg542-frozen-panda');
   const stone=document.querySelector('#pg346 .pg542-static-back');
   const coords=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
   return {panda:coords(panda),stone:coords(stone)};
  });
  const frozen=await portrait();
  const verifyFrozen=async(label)=>{
   const now=await portrait();
   for(const name of ['panda','stone'])for(const property of ['x','y','w','h']){
    const diff=Math.abs(now[name][property]-frozen[name][property]);
    assert(diff<1.6,label+': '+name+'.'+property+' changed by '+diff+': '+JSON.stringify({frozen,now}));
   }
  };
  const send=async(input,answer)=>{
   await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(input);
   await page.locator('#pg346-send').click();
   await page.waitForFunction(expected=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent===expected,answer,{timeout:7000});
   assert.equal(await page.locator('#pg346-rows .pg346-row:last-child .pg346-zh').textContent(),answer);
  };
  await send('我爱你！','谢谢你！我很开心！你叫什么名字？');
  await send('我叫小明。','很高兴认识你！你今天怎么样？');
  await send('我很好。','太好了！你想聊什么？');
  await send('非常好！','太好了！');
  await send('休息','你今天休息吗？');
  await send('很不错，你呢？','我也很好，谢谢！');
  await send('你可以说中文','可以！我们说中文吧！');
  await send('跑步这么样','我喜欢跑步。');
  await verifyFrozen('After multiple dialogue turns');
  const rects=await page.evaluate(()=>{
   const history=document.querySelector('#pg346-rows'),last=history.lastElementChild,scene=document.querySelector('#pg346 .pg346-scene');
   const a=history.getBoundingClientRect(),b=last.getBoundingClientRect(),c=scene?.getBoundingClientRect();
   return {rows:history.children.length,historyBottom:a.bottom,lastTop:b.top,lastBottom:b.bottom,sceneTop:c?.top,historyTop:a.top};
  });
  assert.equal(rects.rows,3,'Three most recent chat cards remain visible');
  assert(rects.lastTop>=rects.historyTop-2 && rects.lastBottom<=rects.historyBottom+3,'Last reply clipped: '+JSON.stringify(rects));
  assert(rects.sceneTop==null || rects.sceneTop>=rects.historyBottom-3,'Panda obscures chat: '+JSON.stringify(rects));
  // Android's real keyboard cannot open in Playwright's headless mobile mode.
  // Emulate the same root flag set by visualViewport/resize and assert that
  // the panda stage keeps room while history hides, then comes back cleanly.
  const keyboard=await page.evaluate(()=>{
   const root=document.documentElement,history=document.querySelector('#pg346-rows');
   const scene=document.querySelector('#pg346 .pg346-scene');
   root.dataset.keyboard='true';
   const opened={historyDisplay:getComputedStyle(history).display,sceneHeight:scene.getBoundingClientRect().height};
   root.dataset.keyboard='false';
   return {...opened,historyRestored:getComputedStyle(history).display};
  });
  assert.equal(keyboard.historyDisplay,'none','Keyboard must not let chat push Panda into a tiny corner');
  assert(keyboard.sceneHeight>=119,'Keyboard shrinks Panda scene: '+JSON.stringify(keyboard));
  assert.notEqual(keyboard.historyRestored,'none','Chat must reappear when keyboard closes');
  // Record the approved full-size illustration, then emulate the resized
  // Android visual viewport. Its dimensions must not jump at all.
  await page.locator('#pg346-send').click();
  const geometry=await page.evaluate(()=>{
    const root=document.documentElement,stage=document.querySelector('#pg346');
    const panda=stage.querySelector('.pg352-mascot');
    const scene=stage.querySelector('.pg346-scene');
    const stone=stage.querySelector('.pg542-static-back');
    const read=()=>{
      const a=panda.getBoundingClientRect(),b=stone.getBoundingClientRect();
      return {pandaWidth:a.width,pandaHeight:a.height,pandaTop:a.top,pandaLeft:a.left,
        stoneWidth:b.width,stoneTop:b.top,stoneLeft:b.left,sceneHeight:scene.getBoundingClientRect().height};
    };
    const normal=read();
    root.style.setProperty('--screen-height','460px');
    root.dataset.keyboard='true';
    const compact=read();
    root.dataset.keyboard='false';
    root.style.setProperty('--screen-height','800px');
    return {normal,compact};
  });
  assert(Math.abs(geometry.normal.pandaWidth-geometry.compact.pandaWidth)<1.6,'Panda rescaled when keyboard opened: '+JSON.stringify(geometry));
  assert(Math.abs(geometry.normal.pandaHeight-geometry.compact.pandaHeight)<2,'Panda changed body proportions: '+JSON.stringify(geometry));
  assert(Math.abs(geometry.normal.stoneWidth-geometry.compact.stoneWidth)<2,'Seating stone rescaled: '+JSON.stringify(geometry));
  for(const prop of ['pandaTop','pandaLeft','stoneTop','stoneLeft'])
    assert(Math.abs(geometry.normal[prop]-geometry.compact[prop])<2,'Panda or stone moved during Android keyboard: '+prop+' '+JSON.stringify(geometry));
  await verifyFrozen('After keyboard open / close');
  const speechAppearance=await page.evaluate(()=>{
    const stage=document.querySelector('#pg346'),panda=stage.querySelector('.pg542-frozen-panda');
    stage.dataset.pose='talking';
    const visible=selector=>{const node=stage.querySelector(selector);return node?getComputedStyle(node).display:'absent'};
    const state={animation:getComputedStyle(panda).animationName,
      mouth:visible('.pg352-mouth'),face:visible('.pg353-face-canvas'),headphones:visible('.pg352-ear-effects'),
      originalHidden:getComputedStyle(stage.querySelector('.pg352-mascot')).visibility};
    stage.dataset.pose='idle';return state;
  });
  assert.equal(speechAppearance.animation,'none','Panda moves while speaking');
  assert.equal(speechAppearance.originalHidden,'hidden','Original animated Panda must be visually hidden');
  assert.equal(speechAppearance.animation,'none','Approved Panda copy must not animate when speaking');
  await verifyFrozen('After Panda speaking state');

  // Android sometimes clears composerOpen while committing pinyin. A single
  // tap on the plane must still send an existing Chinese character.
  await page.locator('#pg346-input').fill('对');
  await page.evaluate(()=>document.querySelector('#pg346').dataset.composerOpen='false');
  await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#pg346-rows .pg346-row .pg346-zh')].some(n=>n.textContent==='对'),null,{timeout:7000});
  assert.equal(await page.locator('#pg346-input').inputValue(),'','One click must empty the input');
  await verifyFrozen('After sending single Chinese character');
  await page.locator('#pg346-nonstop').click();
  await send('不好','怎么了？');
  await verifyFrozen('After Non-Stop conversation');
  assert(!errors.length,'JS error: '+errors.join('; '));
  await page.screenshot({path:'qa/panda-beginner-release/beginner-'+width+'.png',fullPage:false,animations:'disabled'});
  console.log('PASS Panda beginner short/nonstop '+width+'px');
  await context.close();
 }
}finally{await browser.close()}
