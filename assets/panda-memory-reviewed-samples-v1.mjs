/* Approved demo phrases only. Never derive reviewRef from an LLM response.
 * This is a small curriculum sample, not a user chat log or a general AI memory.
 */
export const PANDA_MEMORY_SAMPLES_V1=Object.freeze([
  Object.freeze({
    id:'movie-comedy',topic:'movies',level:'HSK2',
    trigger:'我想看喜剧片。',
    answer:'我喜欢喜剧片。',
    pinyin:'Wǒ xǐhuan xǐjùpiàn.',
    ru:'Я люблю комедии.',
    src:'./assets/panda-context-voice-20261122/chat03.mp3',
    reviewRef:'reviewed:owner_context_nov22',
    voiceId:'voice-093'
  }),
  Object.freeze({
    id:'movie-why',topic:'movies',level:'HSK2',
    trigger:'你为什么喜欢喜剧片？',
    answer:'因为喜剧片很好笑。',
    pinyin:'Yīnwèi xǐjùpiàn hěn hǎoxiào.',
    ru:'Потому что комедии очень смешные.',
    src:'./assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3',
    reviewRef:'reviewed:owner_reason_nov22',
    voiceId:'voice-093'
  }),
  Object.freeze({
    id:'day-rest',topic:'day',level:'HSK2',
    trigger:'今天我休息。',
    answer:'那你今天想做什么？',
    pinyin:'Nà nǐ jīntiān xiǎng zuò shénme?',
    ru:'Тогда что ты хочешь сегодня делать?',
    src:'./assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3',
    reviewRef:'reviewed:owner_day_nov22',
    voiceId:'voice-093'
  })
]);
