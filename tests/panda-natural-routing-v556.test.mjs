import test from 'node:test';
import assert from 'node:assert/strict';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const cases=[
 ['很无聊','Hěn wúliáo.','Мы','我们聊聊天吧！你喜欢看电影吗？','PA-006.mp3'],
 ['我不是老师','Wǒ bú shì lǎoshī.','Я не учитель.','明白了。你做什么工作？','PA-008.mp3'],
 ['我是老师','Wǒ shì lǎoshī.','Я учитель.','你是老师！你在哪儿工作？','PA-001.mp3']
];
for(const [route,lesson,params] of [['default',null,''],['HSK1 short',1,''],['HSK2 short',null,'topic=1'],['HSK2 from lesson',null,'from=hsk2-about-me']]){
 test('Active core understands screenshot sentences on '+route,async()=>{
  const f=await liveDOM(lesson,{params,active:true});
  try{
   for(const [zh,py,ru,reply,clip] of cases){
    f.send(zh);
    const h=f.w.PandaApprovedBridge337.snapshot().history;
    assert.equal(h.at(-2).hanzi,zh,route);
    assert.equal(h.at(-2).pinyin,py,route);
    assert.equal(h.at(-1).hanzi,reply,route);
    assert(f.clips.some(x=>x.src.endsWith('/'+clip)),route+' missing exact '+clip);
   }
  }finally{f.close()}
 });
}
test('Switching tabs does not lose the reviewed statements',async()=>{
 const f=await liveDOM(null,{active:true});
 try{
  for(const mode of ['nonstop','short']){
   f.w.PandaApprovedBridge337.setMode(mode);
   for(const [zh,py,,reply] of cases){
    f.send(zh+'。');
    const h=f.w.PandaApprovedBridge337.snapshot().history;
    assert.equal(h.at(-2).pinyin,py);
    assert.equal(h.at(-1).hanzi,reply);
   }
  }
 }finally{f.close()}
});
