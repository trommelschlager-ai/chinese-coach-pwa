import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v544.mjs';

test('all 18 declared Mandarin professions have individual follow-ups and tone-marked pinyin',()=>{
 const jobs=['老师','学生','医生','工程师','护士','老板','经理','司机','厨师','服务员','警察','销售员','工人','翻译','演员','商人','程序员','设计师'];
 for(const job of jobs){
  const r=reply('我是'+job+'。');
  assert(r,job+' should be recognized');
  assert(r.spoken.pinyin?.startsWith('Wǒ shì '),job);
  assert.equal(r.spoken.toneVerified,false);
  assert(r.reply.hanzi.includes(job),job+' must be acknowledged naturally');
  assert(r.reply.pinyin && r.reply.ru,job);
  assert(!/我没听懂/.test(r.reply.hanzi),job);
 }
});
test('negated jobs use 不 tone sandhi and never affirm the wrong job',()=>{
 for(const phrase of ['我不是医生','我不是护士','我不是程序员']){
  const r=reply(phrase);
  assert(r.spoken.pinyin.startsWith('Wǒ bú shì '));
  assert.equal(r.reply.hanzi,'明白了。你做什么工作？');
 }
});
test('11 named workplaces preserve natural Mandarin and truthful Russian translations',()=>{
 const workplaces=['学校','公司','医院','饭店','餐厅','商店','工厂','办公室','银行','超市','家'];
 for(const workplace of workplaces){
  const r=reply('我在'+workplace+'工作');
  assert(r,'Unrecognized workplace: '+workplace);
  assert.equal(r.reply.hanzi,'你喜欢你的工作吗？');
  assert.equal(r.next,'job-liking');
 }
 assert.equal(reply('我在家工作').spoken.translation,'Я работаю дома.');
 assert.equal(reply('我在餐厅工作').spoken.pinyin,'Wǒ zài cāntīng gōngzuò.');
});
test('work conversation follows the actual yes/no and busy replies',()=>{
 assert.equal(reply('喜欢',{awaiting:'job-liking'}).reply.hanzi,'太好了！你工作忙吗？');
 assert.equal(reply('我喜欢我的工作',{awaiting:'job-liking'}).next,'work-busy');
 assert.equal(reply('我不喜欢我的工作',{awaiting:'job-liking'}).reply.hanzi,'明白了。你想换工作吗？');
 assert.equal(reply('我很忙',{awaiting:'work-busy'}).reply.hanzi,'辛苦了！你每天几点下班？');
 assert.equal(reply('我不忙',{awaiting:'work-busy'}).next,'after-work');
});
test('everyday examples from Mandarin tester no longer become unknown',()=>{
 const cases=[
  ['我在看电影。','你在看什么电影？','Wǒ zài kàn diànyǐng.'],
  ['很无聊','我们聊聊天吧！你喜欢看电影吗？','Hěn wúliáo.'],
  ['你知道吗？','你想告诉我什么？','Nǐ zhīdào ma?'],
  ['我不知道','没关系。你想聊什么？','Wǒ bù zhīdào.'],
  ['我在学习中文','你学中文多久了？','Wǒ zài xuéxí Zhōngwén.'],
  ['我在听音乐','你在听什么音乐？','Wǒ zài tīng yīnyuè.']
 ];
 for(const [phrase,expected,pinyin] of cases){
  const r=reply(phrase);
  assert(r,phrase+' not recognized');
  assert.equal(r.reply.hanzi,expected);
  assert.equal(r.spoken.pinyin,pinyin);
  assert.equal(r.spoken.toneVerified,false);
 }
});
test('work and unemployment do not claim that learner has a job',()=>{
 for(const x of ['我不工作','我没有工作','我现在没有工作','我退休了','我在找工作']){
  const r=reply(x);
  assert(r,x+' must be recognized');
  assert(!r.reply.hanzi.includes('你喜欢你的工作吗'),x);
 }
 assert.equal(reply('我退休了').reply.hanzi,'你退休后喜欢做什么？');
});
test('unreviewed statements stay unknown; no made-up Chinese pronunciation',()=>{
 for(const x of ['我是宇航员','我在外国语学院教书','我是老师你呢','我的名字有六个字','我在放风筝','你知道这个吗']){
  assert.equal(reply(x),null,x);
 }
 assert.equal(reply('我叫米沙').spoken.pinyin,null);
});
test('active Panda AI free chat uses new v544 engine, not the graded quiz or the My Day scenario',()=>{
 const core=readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const pack=JSON.parse(readFileSync(new URL('../assets/offline-pack.json',import.meta.url),'utf8'));
 assert.match(core,/from '.\/panda-natural-statements-v552\.mjs\?v=561'/);
 assert(core.includes("entry.beginnerGreeting&&hsk2.id===101"));
 assert(core.includes("if(mode==='nonstop'&&entry.beginnerGreeting&&hsk2.id===101)"));
 assert(core.includes("hsk2.openChat=true;state.mode='nonstop'"));
 assert.match(core,/say\(natural\.reply,!!lookupPandaVoiceClip\(natural\.reply\.hanzi\)\)/);
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=563/);
 assert(pack.version>=545,'Offline pack must include the latest Panda layout version');
 assert(sw.includes("const CACHE='chinese-coach-pwa-v"+pack.version+"-"),'Service worker cache must match offline pack version');
 assert(pack.files.includes('./assets/panda-natural-statements-v552.mjs?v=561'));
 assert(sw.includes('./assets/panda-natural-statements-v552.mjs?v=561'));
});
