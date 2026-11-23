/* Panda Go · offline memory foundation v1 (NOT wired into live Panda).
 *
 * Online replies can be staged locally for later human review. Only explicitly
 * reviewed phrase pairs with an approved, downloaded Xiaoxiao MP3 are eligible
 * to answer offline. This is exact-match tutoring, not a local generative LLM.
 *
 * No student utterance is stored unless the student has opted in. Data stays
 * in this device's IndexedDB, scoped by account; no conversation is uploaded.
 */
export const PANDA_MEMORY_DB = 'panda-go-memory-v1';
export const PANDA_MEMORY_VERSION = 1;
export const PANDA_MEMORY_MAX_MP3_BYTES = 3 * 1024 * 1024;
const STORE = 'cards';
const OWNER = /^[a-zA-Z0-9_-]{4,100}$/;
const TOPIC = /^[a-z0-9-]{2,50}$/;
const MIN_HANZI = /\p{Script=Han}/u;

export function normalizePandaChinese(text) {
  return String(text ?? '').normalize('NFC').replace(/[\p{P}\s]/gu,'').trim();
}

function requiredText(value, label, max = 500) {
  if (typeof value !== 'string') throw new TypeError(label + ' must be text');
  const text = value.trim().normalize('NFC');
  if (!text || [...text].length > max) throw new RangeError(label + ' length is invalid');
  return text;
}

function scope(ownerId, topic, phrase) {
  if (typeof ownerId !== 'string' || !OWNER.test(ownerId)) throw new TypeError('Invalid local owner');
  if (typeof topic !== 'string' || !TOPIC.test(topic)) throw new TypeError('Invalid topic');
  const normalized = normalizePandaChinese(requiredText(phrase,'Chinese trigger'));
  if (!MIN_HANZI.test(normalized)) throw new TypeError('Expected Mandarin characters');
  return ownerId + '|' + topic + '|' + normalized;
}

export function preparePandaMemoryCandidate(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Missing phrase pair');
  const {ownerId, topic, trigger, answer, pinyin, ru, level = 'HSK2', consent = false} = input;
  if (consent !== true) throw new Error('MEMORY_CONSENT_REQUIRED');
  if (!['HSK1','HSK2'].includes(level)) throw new TypeError('Unsupported course level');
  const id = scope(ownerId,topic,trigger);
  const response = requiredText(answer,'Chinese answer');
  if (!MIN_HANZI.test(response)) throw new TypeError('Chinese answer required');
  return Object.freeze({
    id,ownerId,topic,
    trigger: requiredText(trigger,'Chinese trigger'),
    triggerKey: normalizePandaChinese(trigger),
    answer:response,
    pinyin:requiredText(pinyin,'Tone-marked pinyin'),
    ru:requiredText(ru,'Russian translation'),
    level,
    status:'pending-review',
    // Do not trust a model's own "approved" flag.
    reviewRef:null,
    audioBlob:null,
    voiceId:null,
    source:'unreviewed-online-dialogue'
  });
}

export function prepareReviewedPandaMemory(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Missing review data');
  const {candidate,reviewRef,source,audioBlob,voiceId} = input;
  if (source !== 'approved-course-audio' || typeof reviewRef !== 'string' ||
      !/^reviewed:[a-zA-Z0-9_-]{5,100}$/.test(reviewRef)) {
    throw new Error('Human approval reference required');
  }
  if (voiceId !== 'voice-093') throw new Error('Only reviewed Xiaoxiao voice-093');
  if (!(audioBlob instanceof Blob) || !audioBlob.size ||
      audioBlob.size > PANDA_MEMORY_MAX_MP3_BYTES) throw new RangeError('Invalid offline MP3');
  if (!candidate || candidate.status !== 'pending-review' || !candidate.id) throw new Error('Unreviewed candidate missing');
  return {
    ...candidate,status:'offline-ready',reviewRef,audioBlob,voiceId,
    source:'approved-course-audio'
  };
}

export async function fetchApprovedPandaMp3(src, {baseUrl,fetcher=fetch} = {}) {
  if (typeof baseUrl !== 'string') throw new TypeError('A trusted application origin is required');
  const origin = new URL(baseUrl);
  const url = new URL(src,origin);
  // No third-party, expiring or redirect-based audio is saved as if reviewed.
  if (url.protocol !== 'https:' || origin.protocol !== 'https:' ||
      url.origin !== origin.origin || !/\.mp3$/i.test(url.pathname)) {
    throw new Error('Only same-origin approved MP3 may be downloaded');
  }
  const response = await fetcher(url.href,{credentials:'same-origin',redirect:'error',cache:'no-store'});
  if (!response || !response.ok || response.type === 'opaque') throw new Error('MP3 download failed');
  const blob = await response.blob();
  if (!blob.size || blob.size > PANDA_MEMORY_MAX_MP3_BYTES) throw new RangeError('Offline MP3 size limit');
  // Check MP3 frames/ID3, rather than accepting a cached error page.
  const bytes = new Uint8Array(await blob.slice(0,3).arrayBuffer());
  if (!(bytes[0]===73&&bytes[1]===68&&bytes[2]===51) &&
      !(bytes[0]===255&&(bytes[1]&224)===224)) throw new Error('Invalid MP3 signature');
  return blob;
}

function openPandaMemory(database) {
  if (!database?.open) throw new Error('IndexedDB is unavailable in this browser');
  return new Promise((resolve,reject)=>{
    const request=database.open(PANDA_MEMORY_DB,PANDA_MEMORY_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Cannot open Panda memory'));
    request.onblocked=()=>reject(new Error('Panda memory is blocked by another tab'));
  });
}

async function transact(database, mode, action) {
  const db = await openPandaMemory(database);
  try{
    return await new Promise((resolve,reject)=>{
      let result;
      const tx=db.transaction(STORE,mode);
      const store=tx.objectStore(STORE);
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error||new Error('Memory transaction failed'));
      tx.onabort=()=>reject(tx.error||new Error('Memory transaction aborted'));
      try{
        const request=action(store);
        if (request) {
          request.onsuccess=()=>{result=request.result};
        }
      }catch(err){tx.abort();reject(err)}
    });
  }finally{db.close()}
}

export function createPandaMemoryStore(database = globalThis.indexedDB) {
  return Object.freeze({
    async stage(input) {
      const card=preparePandaMemoryCandidate(input);
      // An online re-encounter must NEVER overwrite a reviewed lesson or its MP3.
      const db=await openPandaMemory(database);
      try {
        return await new Promise((resolve,reject)=>{
          let status='pending-review';
          const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
          const existing=store.get(card.id);
          existing.onsuccess=()=>{
            if(existing.result?.status==='offline-ready')status='offline-ready';
            else store.put(card);
          };
          tx.oncomplete=()=>resolve({id:card.id,status});
          tx.onerror=()=>reject(tx.error||new Error('Panda memory write failed'));
          tx.onabort=()=>reject(tx.error||new Error('Panda memory write aborted'));
        });
      }finally{db.close()}
    },
    async approve(input) {
      const card=prepareReviewedPandaMemory(input);
      // The approval source must be a reviewed course catalog, not AI self-approval.
      await transact(database,'readwrite',store=>store.put(card));
      return {id:card.id,status:card.status};
    },
    async recall({ownerId,topic,trigger}) {
      const id=scope(ownerId,topic,trigger);
      const row=await transact(database,'readonly',store=>store.get(id));
      if (!row || row.status!=='offline-ready' || row.voiceId!=='voice-093' ||
          !(row.audioBlob instanceof Blob)) return null;
      return {answer:row.answer,pinyin:row.pinyin,ru:row.ru,topic:row.topic,
        level:row.level,audioBlob:row.audioBlob,voiceId:row.voiceId,
        source:'reviewed-offline-memory'};
    },
    async delete({ownerId,topic,trigger}) {
      await transact(database,'readwrite',store=>store.delete(scope(ownerId,topic,trigger)));
    },
    async clearOwner(ownerId) {
      if(typeof ownerId!=='string'||!OWNER.test(ownerId))throw new TypeError('Invalid local owner');
      const db=await openPandaMemory(database);
      try {
        await new Promise((resolve,reject)=>{
          const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
          const cur=store.openCursor();
          cur.onsuccess=()=>{
            const row=cur.result;
            if(!row)return;
            if(row.value?.ownerId===ownerId)row.delete();
            row.continue();
          };
          tx.oncomplete=resolve;
          tx.onerror=()=>reject(tx.error);
          tx.onabort=()=>reject(tx.error);
        });
      }finally{db.close()}
    }
  });
}
