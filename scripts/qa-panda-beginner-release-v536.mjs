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
  const send=async(input,answer)=>{
   await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(input);
   await page.locator('#pg346-send').click();
   await page.waitForFunction(expected=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent===expected,answer,{timeout:7000}).catch(async e=>{
    const observed=await page.evaluate(()=>({
      rows:[...document.querySelectorAll('#pg346-rows .pg346-row')].map(r=>({
        name:r.querySelector('.pg346-zh')?.textContent,
        en:r.querySelector('.pg346-ru')?.textContent,
        node:r.outerHTML.slice(0,350)
      })),
      input:document.querySelector('#pg346-input')?.value,
      composer:document.querySelector('#pg346')?.dataset.composerOpen,
      note:document.querySelector('#pg346-status')?.textContent,
      body:document.querySelector('#pg346')?.dataset,
      state:document.documentElement.dataset
    }));
    console.error('PANDA_QA_SEND_FAIL',JSON.stringify({input,answer,observed,errors}));
    throw e;
   });
   assert.equal(await page.locator('#pg346-rows .pg346-row:last-child .pg346-zh').textContent(),answer);
  };
  // v548: independent learner question has a pre-recorded Mandarin response.
  await send('我先介绍一下自己','好啊！你来自哪里？');
  await send('吉尔吉斯斯坦','你现在住在哪儿？');
  await send('我每天早上七点起床','你起床以后做什么？');
  await send('我先刷牙','然后呢？');
  await send('我想买一双鞋','你有多少预算？');
  await send('两百块','你想去商店看看吗？');
  await send('我想去北京','你什么时候去？');
  await send('下周','你怎么去？');
  await send('坐火车','祝你一路顺风！');
  await send('我爱喝咖啡','你经常喝吗？');
  await send('我不经常喝','那你想喝什么？');
  await send('我想喝茶','你经常喝吗？');
  await send('我在公司工作','你喜欢你的工作吗？');
  await send('不喜欢','明白了。你想换工作吗？');
  await send('想换工作','你想做什么工作？');
  await send('我有一个姐姐','你姐姐几岁？');
  await send('请再说一遍','你姐姐几岁？');
  await send('她二十二岁','你姐姐二十二岁！她喜欢做什么？');
  await send('我没有孩子','你家有几口人？');
  await send('三口人','你跟家人一起住吗？');
  await send('我一个人住','你住在哪里？');
  await send('我想练习中文','好啊！你想练什么？');
  await send('这个词是什么意思','请把那个词打出来。');
  await send('你是老师吗？','我是老师。');
  await send('我爱你！','谢谢你！我很开心！你叫什么名字？');
  await send('我叫小明。','很高兴认识你！你今天怎么样？');
  await send('我很好。','太好了！你想聊什么？');
  await send('非常好！','太好了！');
  await send('休息','你今天休息吗？');
  await send('很不错，你呢？','我也很好，谢谢！');
  await send('你可以说中文','可以！我们说中文吧！');
  await send('跑步这么样','我喜欢跑步。');
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
    const read=()=>({
      pandaWidth:panda.getBoundingClientRect().width,
      pandaHeight:panda.getBoundingClientRect().height,
      stoneWidth:parseFloat(getComputedStyle(scene,'::before').width),
      sceneHeight:scene.getBoundingClientRect().height
    });
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
  // Android sometimes clears composerOpen while committing pinyin. A single
  // tap on the plane must still send an existing Chinese character.
  await page.locator('#pg346-input').fill('对');
  await page.evaluate(()=>document.querySelector('#pg346').dataset.composerOpen='false');
  await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#pg346-rows .pg346-row .pg346-zh')].some(n=>n.textContent==='对'),null,{timeout:7000});
  assert.equal(await page.locator('#pg346-input').inputValue(),'','One click must empty the input');
  await page.locator('#pg346-nonstop').click();
  await send('不好','怎么了？');
  await send('我先介绍一下自己','好啊！你来自哪里？');
  await send('吉尔吉斯斯坦','你现在住在哪儿？');
  await send('我每天早上七点起床','你起床以后做什么？');
  await send('我先刷牙','然后呢？');
  await send('我想买一双鞋','你有多少预算？');
  await send('两百块','你想去商店看看吗？');
  await send('我想去北京','你什么时候去？');
  await send('下周','你怎么去？');
  await send('坐火车','祝你一路顺风！');
  await send('我爱喝咖啡','你经常喝吗？');
  await send('我不经常喝','那你想喝什么？');
  await send('我想喝茶','你经常喝吗？');
  await send('我在公司工作','你喜欢你的工作吗？');
  await send('不喜欢','明白了。你想换工作吗？');
  await send('想换工作','你想做什么工作？');
  await send('我有一个姐姐','你姐姐几岁？');
  await send('请再说一遍','你姐姐几岁？');
  await send('她二十二岁','你姐姐二十二岁！她喜欢做什么？');
  await send('我没有孩子','你家有几口人？');
  await send('三口人','你跟家人一起住吗？');
  await send('我一个人住','你住在哪里？');
  await send('我想练习中文','好啊！你想练什么？');
  await send('这个词是什么意思','请把那个词打出来。');
  await send('你是老师吗？','我是老师。');
  // The HSK2 short quiz stays scored; independent statements belong in free topic chat.
  await page.locator('#pg346-topics-btn').click();
  const hsk2Topics=page.locator('#pg346-topics .pg346-topic-group').nth(1).locator('button');
  await hsk2Topics.first().click();
  await page.locator('#pg374-topic-details .pg374-question').first().click();
  await send('我是老师。','你是老师！你在哪儿工作？');
  await send('我在学校工作。','你喜欢你的工作吗？');
  await send('我是医生。','你是医生！你在哪儿工作？');
  await send('我在看电影。','你在看什么电影？');
  await send('很无聊','我们聊聊天吧！你喜欢看电影吗？');
  await send('你知道吗？','你想告诉我什么？');
  assert(!errors.length,'JS error: '+errors.join('; '));
  await page.screenshot({path:'qa/panda-beginner-release/beginner-'+width+'.png',fullPage:false,animations:'disabled'});
  console.log('PASS Panda beginner short/nonstop '+width+'px');
  await context.close();
 }
}finally{await browser.close()}
