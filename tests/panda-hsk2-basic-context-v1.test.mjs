import test from 'node:test';
import assert from 'node:assert/strict';
import {knownBasicContext,replyBasicContext} from '../assets/panda-hsk2-basic-context-v1.mjs';
import {knownHSK2,replyHSK2} from '../assets/panda-hsk2-brain-v1.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';

const cases = [
  ['今天你有没有空？','Jīntiān nǐ yǒu méiyǒu kòng?','availability','今天我有空，可以聊聊天。'],
  ['现在我很忙。','Xiànzài wǒ hěn máng.','busy','好的，那你先忙吧。'],
  ['今天我休息。','Jīntiān wǒ xiūxi.','rest-today','那你今天想做什么？'],
  ['现在我休息。','Xiànzài wǒ xiūxi.','rest-now','那你想聊聊天吗？'],
  ['工作','gōngzuò','work-topic','你想聊聊工作吗？'],
  ['我今天不工作。','Wǒ jīntiān bù gōngzuò.','rest-today','那你今天想做什么？'],
  ['我想看电影。','Wǒ xiǎng kàn diànyǐng.','movie-plan','你想看什么电影？'],
  ['我想看喜剧片。','Wǒ xiǎng kàn xǐjùpiàn.','movie-comedy','我喜欢喜剧片。'],
  ['你为什么喜欢喜剧片？','Nǐ wèishénme xǐhuan xǐjùpiàn?','movie-why','因为喜剧片很好笑。']
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
    if(response==='今天我有空，可以聊聊天。') assert.equal(turn.line.pinyin,'Jīntiān wǒ yǒu kòng, kěyǐ liáoliao tiān.');
    if(response==='那你想聊聊天吗？') assert.equal(turn.line.pinyin,'Nà nǐ xiǎng liáoliao tiān ma?');
    if(response==='你想聊聊工作吗？') assert.equal(turn.line.pinyin,'Nǐ xiǎng liáoliao gōngzuò ma?');
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
    ['我在工作。','Wǒ zài gōngzuò.','busy'],
    ['今天我不工作。','Jīntiān wǒ bù gōngzuò.','rest-today'],
    ['我今天不上班。','Wǒ jīntiān bú shàngbān.','rest-today'],
    ['今天我不上班。','Jīntiān wǒ bú shàngbān.','rest-today'],
    ['我今天不用上班。','Wǒ jīntiān bú yòng shàngbān.','rest-today'],
    ['今天我不用上班。','Jīntiān wǒ bú yòng shàngbān.','rest-today'],
    ['今天我想看电影。','Jīntiān wǒ xiǎng kàn diànyǐng.','movie-plan'],
    ['我今天想看电影。','Wǒ jīntiān xiǎng kàn diànyǐng.','movie-plan'],
    ['我想去看电影。','Wǒ xiǎng qù kàn diànyǐng.','movie-plan'],
    ['我想看一部电影。','Wǒ xiǎng kàn yí bù diànyǐng.','movie-plan'],
    ['我喜欢喜剧片。','Wǒ xǐhuan xǐjùpiàn.','movie-comedy'],
    ['喜剧片','xǐjùpiàn','movie-comedy'],
    ['为什么你喜欢喜剧片？','Wèishénme nǐ xǐhuan xǐjùpiàn?','movie-why'],
    ['你为什么喜欢看喜剧片？','Nǐ wèishénme xǐhuan kàn xǐjùpiàn?','movie-why'],
    ['为什么喜欢喜剧片？','Wèishénme xǐhuan xǐjùpiàn?','movie-why'],
    ['你为什么喜欢喜剧电影？','Nǐ wèishénme xǐhuan xǐjù diànyǐng?','movie-why']
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
  assert.equal(replyBasicContext('我昨天不工作'),null);
  assert.equal(replyBasicContext('我今天在工作'),null);
  assert.equal(replyBasicContext('我不想看电影'),null);
  assert.equal(replyBasicContext('我昨天看了电影'),null);
  assert.equal(replyBasicContext('你为什么不喜欢喜剧片？'),null);
  assert.equal(replyBasicContext('你为什么喜欢恐怖片？'),null);
  assert.equal('toneVerified' in replyBasicContext('工作'),false);
});

test('A day-off answer can lead to a real second and third movie-related turn',()=>{
  const dayOff=replyHSK2('我今天不工作。',101,0,false,{awaiting:'origin'});
  assert.equal(dayOff.line.hanzi,'那你今天想做什么？');
  assert.equal(dayOff.context.awaiting,'plans');

  const movie=replyHSK2('我想看电影。',101,0,false,dayOff.context);
  assert.equal(movie.kind,'social');
  assert.equal(movie.spoken.pinyin,'Wǒ xiǎng kàn diànyǐng.');
  assert.equal(movie.spoken.ru,'Я хочу посмотреть фильм.');
  assert.equal(movie.line.hanzi,'你想看什么电影？');
  assert.equal(movie.line.pinyin,'Nǐ xiǎng kàn shénme diànyǐng?');
  assert.equal(movie.context.awaiting,'movie-choice');
  assert.equal(lookupApprovedPandaVoice(movie.line.hanzi)?.src,'./assets/panda-ai-voice-20261128/PA-20261128-034.mp3','Use the exact new owner-supplied recording');

  const genre=replyHSK2('我想看喜剧片。',101,0,false,movie.context);
  assert.equal(genre.kind,'social');
  assert.equal(genre.spoken.ru,'Я хочу посмотреть комедию.');
  assert.equal(genre.line.hanzi,'我喜欢喜剧片。');
  assert.equal(genre.context.awaiting,'movie-topic');
  assert.equal(lookupApprovedPandaVoice(genre.line.hanzi)?.src,'./assets/panda-context-voice-20261122/chat03.mp3');

  const why=replyHSK2('你为什么喜欢喜剧片？',101,0,false,genre.context);
  assert.equal(why.kind,'social');
  assert.equal(why.spoken.pinyin,'Nǐ wèishénme xǐhuan xǐjùpiàn?');
  assert.equal(why.spoken.ru,'Почему тебе нравятся комедии?');
  assert.equal(why.line.hanzi,'因为喜剧片很好笑。');
  assert.equal(why.line.pinyin,'Yīnwèi xǐjùpiàn hěn hǎoxiào.');
  assert.equal(why.line.ru,'Потому что комедии очень смешные.');
  assert.equal(why.context.awaiting,'movie-topic');
  assert.equal(lookupApprovedPandaVoice(why.line.hanzi)?.src,'./assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3','Use only the exact user-supplied Xiaoxiao MP3 for the new answer');
});

test('Existing HSK2 exact answer and social question remain functional',()=>{
  assert.equal(replyHSK2('我来自俄罗斯。',101,0).kind,'accepted');
  assert.equal(replyHSK2('你喜欢我吗？',101,0).line.hanzi,'我喜欢和你聊天。');
});
