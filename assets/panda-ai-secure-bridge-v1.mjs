/* Panda Go: opt-in, secure AI conversation transport.
 * This is deliberately NOT imported by the live Panda. Until a server passes
 * authentication, quota and voice review, all approved MP3 pathways stay intact.
 * The module stores no session, password, key or conversation in localStorage.
 */
export const PANDA_AI_CONTRACT_VERSION = 1;
export const PANDA_AI_MAX_TURNS = 8;
export const PANDA_AI_MAX_MESSAGE_CHARS = 500;
const KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;

export function boundedHistory(turns = []) {
  if (!Array.isArray(turns)) throw new TypeError('History must be an array');
  return turns.slice(-PANDA_AI_MAX_TURNS).map((item, index) => {
    if (!item || (item.role !== 'user' && item.role !== 'assistant')) {
      throw new TypeError('Invalid role at turn ' + index);
    }
    const text = String(item.text ?? '').trim().normalize('NFC');
    if (!text || [...text].length > PANDA_AI_MAX_MESSAGE_CHARS) {
      throw new RangeError('Invalid previous message length');
    }
    return { role: item.role, text };
  });
}

export function buildPandaAIRequest({ utterance, history = [], level = 'HSK2', topic = 'free-chat' }) {
  const message = typeof utterance === 'string' ? utterance.trim().normalize('NFC') : '';
  if (!message || [...message].length > PANDA_AI_MAX_MESSAGE_CHARS) {
    throw new RangeError('Message must contain 1–500 characters');
  }
  if (!/\p{Script=Han}/u.test(message)) throw new TypeError('Expected Mandarin text');
  if (!['HSK1', 'HSK2'].includes(level)) throw new TypeError('Unsupported course level');
  if (typeof topic !== 'string' || !KEY_PATTERN.test(topic)) throw new TypeError('Invalid topic');
  return { version: PANDA_AI_CONTRACT_VERSION, utterance: message, history: boundedHistory(history), level, topic };
}

export function validatePandaAIResponse(data) {
  if (!data || typeof data !== 'object' || data.realAI !== true || data.contractVersion !== 1) {
    throw new TypeError('Unverified AI response');
  }
  if (!data.answer || typeof data.answer !== 'object') throw new TypeError('Missing structured answer');
  const { hanzi, pinyin, ru } = data.answer;
  if (![hanzi,pinyin,ru].every(x=>typeof x === 'string' && x.trim().length > 0 && [...x].length <= 600)) {
    throw new TypeError('Incomplete Chinese answer, pinyin or Russian translation');
  }
  if (!/\p{Script=Han}/u.test(hanzi)) throw new TypeError('Answer must be Mandarin');
  // A browser transcript alone NEVER verifies tones. No AI model is allowed to
  // turn an ASR string or grammar assessment into an acoustic tone verdict.
  const answer = { hanzi, pinyin, ru, toneVerified: false, kind: 'server-ai-unreviewed' };
  const provider = data.audio?.provider;
  const voiceId = data.audio?.voiceId;
  const audioUrl = data.audio?.url;
  let audio = null;
  if (provider === 'luvvoice' && voiceId === 'voice-093' && typeof audioUrl === 'string') {
    try {
      const url = new URL(audioUrl);
      if (url.protocol === 'https:' && url.hostname === 'cdn.luvvoice.com') {
        audio = { url: url.href, provider: 'luvvoice', voiceId: 'voice-093', ephemeral: true };
      }
    } catch { /* Keep the correct text but never load an untrusted audio URL. */ }
  }
  const note = typeof data.coachNoteRu === 'string' ? data.coachNoteRu.slice(0,300) : null;
  return { answer, audio, coachNoteRu: note, realAI: true, status: audio ? 'xiaoxiao-audio' : 'text-only' };
}

// Only a signed-in user can manually invoke this adapter. No direct LLM or TTS
// request ever comes from a GitHub Pages/public browser client.
export function createPandaAISecureClient({ endpoint, publishableKey, getAccessToken, request = fetch }) {
  const u = new URL(endpoint);
  if (u.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname) ||
      u.pathname !== '/functions/v1/panda-ai-chat-v1') {
    throw new TypeError('Only the approved Supabase function endpoint is allowed');
  }
  if (typeof publishableKey !== 'string' || !publishableKey.startsWith('sb_publishable_')) {
    throw new TypeError('Invalid public Supabase key');
  }
  if (typeof getAccessToken !== 'function' || typeof request !== 'function') {
    throw new TypeError('Authenticated transport required');
  }
  return Object.freeze({
    async send(input) {
      const body = buildPandaAIRequest(input);
      const token = await getAccessToken();
      if (typeof token !== 'string' || !token.trim()) throw new Error('AUTH_REQUIRED');
      const response = await request(u.href, {
        method: 'POST',
        headers: { apikey: publishableKey, authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store'
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('AUTH_REQUIRED');
        if (response.status === 403) throw new Error('NO_ACCESS');
        if (response.status === 429) throw new Error('LIMIT_REACHED');
        throw new Error('AI_UNAVAILABLE');
      }
      return validatePandaAIResponse(await response.json());
    }
  });
}
