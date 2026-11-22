/* Panda AI: bounded, context-aware replies for common HSK1/2 conversation.
 * Deliberately exact and reviewed: do not guess translations, claim acoustic
 * tone verification, or silently send arbitrary learner text to a fake AI.
 * Panda's audio player will speak only when an approved exact MP3 exists.
 */
const normalize = value => String(value || '').normalize('NFC').replace(/[\p{P}\s]/gu, '');

const phrases = [
  // Asking whether Panda is free.
  ['今天你有没有空', 'Jīntiān nǐ yǒu méiyǒu kòng?', 'У тебя сегодня есть время?', 'availability'],
  ['你今天有没有空', 'Nǐ jīntiān yǒu méiyǒu kòng?', 'У тебя сегодня есть время?', 'availability'],
  ['今天你有空吗', 'Jīntiān nǐ yǒu kòng ma?', 'Ты сегодня свободен?', 'availability'],
  ['你今天有空吗', 'Nǐ jīntiān yǒu kòng ma?', 'Ты сегодня свободен?', 'availability'],
  ['你现在有空吗', 'Nǐ xiànzài yǒu kòng ma?', 'У тебя сейчас есть время?', 'availability'],
  ['现在你有空吗', 'Xiànzài nǐ yǒu kòng ma?', 'У тебя сейчас есть время?', 'availability'],
  ['你有没有空', 'Nǐ yǒu méiyǒu kòng?', 'У тебя есть время?', 'availability'],
  ['你有空吗', 'Nǐ yǒu kòng ma?', 'Ты свободен?', 'availability'],

  // Correct, natural learner statements: being busy.
  ['现在我很忙', 'Xiànzài wǒ hěn máng.', 'Сейчас я очень занят.', 'busy'],
  ['我现在很忙', 'Wǒ xiànzài hěn máng.', 'Сейчас я очень занят.', 'busy'],
  ['我很忙', 'Wǒ hěn máng.', 'Я очень занят.', 'busy'],
  ['今天我很忙', 'Jīntiān wǒ hěn máng.', 'Сегодня я очень занят.', 'busy'],
  ['我今天很忙', 'Wǒ jīntiān hěn máng.', 'Сегодня я очень занят.', 'busy'],
  ['我有点忙', 'Wǒ yǒudiǎn máng.', 'Я немного занят.', 'busy'],
  ['我现在有点忙', 'Wǒ xiànzài yǒudiǎn máng.', 'Сейчас я немного занят.', 'busy'],
  ['现在我有点忙', 'Xiànzài wǒ yǒudiǎn máng.', 'Сейчас я немного занят.', 'busy'],
  ['我没空', 'Wǒ méi kòng.', 'У меня нет свободного времени.', 'busy'],
  ['我没有空', 'Wǒ méiyǒu kòng.', 'У меня нет свободного времени.', 'busy'],
  ['我今天没空', 'Wǒ jīntiān méi kòng.', 'Сегодня я занят.', 'busy'],
  ['今天我没空', 'Jīntiān wǒ méi kòng.', 'Сегодня я занят.', 'busy'],
  ['我现在没空', 'Wǒ xiànzài méi kòng.', 'Сейчас я занят.', 'busy'],
  ['现在我没空', 'Xiànzài wǒ méi kòng.', 'Сейчас я занят.', 'busy'],
  ['我在工作', 'Wǒ zài gōngzuò.', 'Я работаю.', 'busy'],
  ['我现在在工作', 'Wǒ xiànzài zài gōngzuò.', 'Сейчас я работаю.', 'busy'],

  // Not going to work today is a normal, correct everyday statement.
  // It is NOT a grammar mistake and must not lead to "please speak simpler".
  // Reuse the already approved Xiaoxiao response and its exact MP3.
  ['我今天不工作', 'Wǒ jīntiān bù gōngzuò.', 'Сегодня я не работаю.', 'rest-today'],
  ['今天我不工作', 'Jīntiān wǒ bù gōngzuò.', 'Сегодня я не работаю.', 'rest-today'],
  ['我今天不上班', 'Wǒ jīntiān bú shàngbān.', 'Сегодня я не иду на работу.', 'rest-today'],
  ['今天我不上班', 'Jīntiān wǒ bú shàngbān.', 'Сегодня я не иду на работу.', 'rest-today'],
  ['我今天不用上班', 'Wǒ jīntiān bú yòng shàngbān.', 'Сегодня мне не нужно идти на работу.', 'rest-today'],
  ['今天我不用上班', 'Jīntiān wǒ bú yòng shàngbān.', 'Сегодня мне не нужно идти на работу.', 'rest-today'],

  // Rest, keeping the today/now distinction in the reply.
  ['今天我休息', 'Jīntiān wǒ xiūxi.', 'Сегодня я отдыхаю.', 'rest-today'],
  ['我今天休息', 'Wǒ jīntiān xiūxi.', 'Сегодня я отдыхаю.', 'rest-today'],
  ['现在我休息', 'Xiànzài wǒ xiūxi.', 'Сейчас я отдыхаю.', 'rest-now'],
  ['我现在休息', 'Wǒ xiànzài xiūxi.', 'Сейчас я отдыхаю.', 'rest-now'],
  ['现在我在休息', 'Xiànzài wǒ zài xiūxi.', 'Сейчас я отдыхаю.', 'rest-now'],
  ['我现在在休息', 'Wǒ xiànzài zài xiūxi.', 'Сейчас я отдыхаю.', 'rest-now'],

  // Day-off plans: continue the *previous topic*, do not ask the learner to speak simpler.
  // Keep this a bounded set of reviewed beginner utterances; no unverified generic translation.
  ['我想看电影', 'Wǒ xiǎng kàn diànyǐng.', 'Я хочу посмотреть фильм.', 'movie-plan'],
  ['我今天想看电影', 'Wǒ jīntiān xiǎng kàn diànyǐng.', 'Сегодня я хочу посмотреть фильм.', 'movie-plan'],
  ['今天我想看电影', 'Jīntiān wǒ xiǎng kàn diànyǐng.', 'Сегодня я хочу посмотреть фильм.', 'movie-plan'],
  ['我想去看电影', 'Wǒ xiǎng qù kàn diànyǐng.', 'Я хочу пойти посмотреть фильм.', 'movie-plan'],
  ['我想看一部电影', 'Wǒ xiǎng kàn yí bù diànyǐng.', 'Я хочу посмотреть фильм.', 'movie-plan'],

  // Next turn of the same film conversation: respond to a concrete genre.
  ['我想看喜剧片', 'Wǒ xiǎng kàn xǐjùpiàn.', 'Я хочу посмотреть комедию.', 'movie-comedy'],
  ['我喜欢喜剧片', 'Wǒ xǐhuan xǐjùpiàn.', 'Мне нравятся комедии.', 'movie-comedy'],
  ['喜剧片', 'xǐjùpiàn', 'Комедии.', 'movie-comedy'],

  // A one-word topic is not automatically a grammar error.
  ['工作', 'gōngzuò', 'Работа; работать.', 'work-topic']
];
const known = new Map(phrases.map(([hanzi,pinyin,ru,intent]) =>
  [hanzi, Object.freeze({pinyin,ru,intent})]));

const responses = Object.freeze({
  availability: ['今天我有空，可以聊聊天。', 'Jīntiān wǒ yǒu kòng, kěyǐ liáoliao tiān.', 'Сегодня у меня есть время, можем поболтать.', 'conversation'],
  busy: ['好的，那你先忙吧。', 'Hǎo de, nà nǐ xiān máng ba.', 'Хорошо, тогда занимайся своими делами.', null],
  'rest-today': ['那你今天想做什么？', 'Nà nǐ jīntiān xiǎng zuò shénme?', 'Тогда что ты хочешь сегодня делать?', 'plans'],
  'rest-now': ['那你想聊聊天吗？', 'Nà nǐ xiǎng liáoliao tiān ma?', 'Тогда хочешь немного поболтать?', 'conversation'],
  'work-topic': ['你想聊聊工作吗？', 'Nǐ xiǎng liáoliao gōngzuò ma?', 'Хочешь поговорить о работе?', 'work'],
  // No approved Xiaoxiao MP3 for this new question: remain text-only until one is recorded.
  'movie-plan': ['你想看什么电影？', 'Nǐ xiǎng kàn shénme diànyǐng?', 'Какой фильм ты хочешь посмотреть?', 'movie-choice'],
  // Existing approved Xiaoxiao context clip chat03.mp3, not a newly generated voice.
  'movie-comedy': ['我喜欢喜剧片。', 'Wǒ xǐhuan xǐjùpiàn.', 'Я люблю комедии.', 'movie-topic']
});

export function knownBasicContext(raw) {
  const entry = known.get(normalize(raw));
  return entry ? {hanzi:String(raw).trim(),pinyin:entry.pinyin,ru:entry.ru,intent:entry.intent} : null;
}

export function replyBasicContext(raw,context=null) {
  const spoken = knownBasicContext(raw);
  if (!spoken) return null;
  const [hanzi,pinyin,ru,awaiting] = responses[spoken.intent];
  return {
    kind:'social',
    spoken:{hanzi:spoken.hanzi,pinyin:spoken.pinyin,ru:spoken.ru},
    line:{hanzi,pinyin,ru,audioKey:hanzi},
    context:{...(context || {}),awaiting,lastClarification:null}
  };
}
