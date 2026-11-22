import test from 'node:test';
import assert from 'node:assert/strict';
import {knownBasicContext,replyBasicContext} from '../assets/panda-hsk2-basic-context-v1.mjs';
import {knownHSK2,replyHSK2} from '../assets/panda-hsk2-brain-v1.mjs';

const cases = [
  ['今天你有没有空？','Jīntiān nǐ yǒu méiyǒu kòng?','availability','今天我有空，可以聊聊天。'],
  ['现在我很忙。','Xiànzài wǒ hěn máng.','busy','好的，那你先忙吧。'],
  ['今天我休息。','Jīntiān wǒ xiūxi.','rest-today','那你今天想做什么？'],
  ['现在我休息。','Xiànzài wǒ xiūxi.','rest-now','那你想聊聊天吗？'],
  ['工作','gōngzuò','work-topic','你想聊聊工作吗？']
];

test('Every screenshot regression phrase has pinyin, Russian and a contextual answer',()=>{
  for(const [zh,py,intent,response] of cases){
    const known=knownBasicContext(zh);
    assert.ok(known,zh+' should be recognized');
    assert.equal(known.pinyin,py,zh);
    assert.ok(known.ru.length>6,zh+' needs Russian translation');
    assert.equal(known.intent,intent,zh);
    const turn=replyHSK2(zh,101,0,false,{awaiting:'origin'});
    assert.equal(turn.kind,'social',zh);
    assert.equal(turn.spoken.pinyin,py,zh);
    assert.equal(turn.spoken.ru,known.ru,zh);
    assert.equal(turn.line.hanzi,response,zh);
    assert.ok(turn.line.pinyin.length>10,zh);
    assert.ok(turn.line.ru.length>8,zh);
    assert.equal(turn.context.awaiting,replyBasicContext(zh).context.awaiting);
    assert.equal(knownHSK2(zh)?.pinyin,py,zh);
  }
});

test('Natural word order, punctuation and tone neutral syllables are preserved',()=>{
  const variants=[
    ['你今天有空吗？','Nǐ jīntiān yǒu kòng ma?','availability'],
    ['我现在很忙。','Wǒ xiànzài hěn máng.','busy'],
    ['我有点忙。','Wǒ yǒudiǎn máng.','busy'],
    ['我今天休息。','Wǒ jīntiān xiūxi.','rest-today'],
    ['我现在在休息。','Wǒ xiànzài zài xiūxi.','rest-now'],
    ['我在工作。','Wǒ zài gōngzuò.','busy']
  ];
  for(const [zh,pinyin,intent] of variants){
    const actual=knownBasicContext(' '+zh+' ');
    assert.equal(actual.pinyin,pinyin,zh);
    assert.equal(actual.intent,intent,zh);
  }
});

test('Do not pretend to understand unreviewed speech or invent a tone score',()=>{
  assert.equal(knownBasicContext('不知道你好'),null);
  assert.equal(replyBasicContext('明天会下雨吗？'),null);
  assert.equal(replyBasicContext('对我很重要。'),null);
  assert.equal('toneVerified' in replyBasicContext('工作'),false);
});

test('Existing HSK2 exact answer and social question remain functional',()=>{
  assert.equal(replyHSK2('我来自俄罗斯。',101,0).kind,'accepted');
  assert.equal(replyHSK2('你喜欢我吗？',101,0).line.hanzi,'我喜欢和你聊天。');
});
