/* Panda Go · shared curriculum memory v1.
 * Shared reviewed *course content only*. No learner IDs, chat messages,
 * profiles, secrets or personal data enter this database or network request.
 * Personal Panda Memory remains in its separate panda-go-memory-v1 IndexedDB.
 * Static reviewed catalog is the publishing allowlist; an arbitrary remote
 * manifest cannot make AI output "approved".
 */
import {PANDA_MEMORY_SAMPLES_V1 as REVIEWED} from './panda-memory-reviewed-samples-v1.mjs';
import {fetchApprovedPandaMp3,normalizePandaChinese} from './panda-offline-memory-v1.mjs';

export const PANDA_SHARED_DB='panda-go-shared-library-v1';
export const PANDA_SHARED_SCHEMA=1;
const CARD_STORE='approved-cards';
const META_STORE='release';
const MAX_RELEASE_ITEMS=100;
const REQUIRED_KEYS=['id','topic','level','trigger','answer','pinyin','ru','src','reviewRef','voiceId'];
const APPROVED_BY_ID=new Map(REVIEWED.map(item=>[item.id,item]));
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const message=(value,max)=>{
 if(typeof value!=='string'||!value.trim()||[...value].length>max)throw new Error('Invalid shared lesson field');
 return value.trim().normalize('NFC');
};

export function checkSharedPandaManifest(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
    input.schemaVersion!==1||!Number.isSafeInteger(input.release)||input.release<1||
    !Array.isArray(input.entries)||input.entries.length<1||input.entries.length>MAX_RELEASE_ITEMS){
  throw new Error('Invalid shared library release');
 }
 if(Object.keys(input).some(k=>!['schemaVersion','release','issued','title','language','entries'].includes(k)))
  throw new Error('Unexpected shared library metadata');
 if(input.language!=='zh-CN')throw new Error('Wrong shared language');
 message(input.title,150);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.issued))throw new Error('Invalid release date');
 const ids=new Set(), keys=new Set();
 const entries=input.entries.map(entry=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||
    Object.keys(entry).length!==REQUIRED_KEYS.length||
    REQUIRED_KEYS.some(k=>!own(entry,k)))throw new Error('Extra or missing course field');
  const id=message(entry.id,80),ref=APPROVED_BY_ID.get(id);
  if(!ref)throw new Error('A public course card must be approved in source');
  if(ids.has(id))throw new Error('Duplicate shared lesson ID');
  ids.add(id);
  for(const field of REQUIRED_KEYS){
   if(typeof entry[field]!=='string'||entry[field]!==ref[field])
    throw new Error('Shared card differs from reviewed source: '+field);
  }
  const key=entry.topic+'|'+normalizePandaChinese(entry.trigger);
  if(keys.has(key))throw new Error('Duplicate phrase in shared pack');
  keys.add(key);
  if(entry.voiceId!=='voice-093'||!entry.reviewRef.startsWith('reviewed:'))
   throw new Error('Only reviewed Xiaoxiao can be published');
  return Object.freeze({...entry});
 });
 return Object.freeze({schemaVersion:1,release:input.release,issued:input.issued,title:input.title,language:'zh-CN',
  entries:Object.freeze(entries)});
}

function openShared(database){
 if(!database?.open)throw new Error('IndexedDB unavailable');
 return new Promise((resolve,reject)=>{
  const request=database.open(PANDA_SHARED_DB,PANDA_SHARED_SCHEMA);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains(CARD_STORE))db.createObjectStore(CARD_STORE,{keyPath:'id'});
   if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Shared library database failed'));
  request.onblocked=()=>reject(new Error('Shared library database is in another tab'));
 });
}
function task(database,stores,mode,body){
 return openShared(database).then(async db=>{
  try{
   return await new Promise((resolve,reject)=>{
    let result;
    const tx=db.transaction(stores,mode);
    tx.oncomplete=()=>resolve(result);
    tx.onabort=()=>reject(tx.error||new Error('Shared library write aborted'));
    tx.onerror=()=>reject(tx.error||new Error('Shared library transaction failed'));
    try{
     const req=body(tx,v=>{result=v});
     if(req)req.onsuccess=()=>{result=req.result};
    }catch(e){tx.abort();reject(e)}
   });
  }finally{db.close()}
 });
}

export function createPandaSharedLibrary({database=globalThis.indexedDB,baseUrl,fetcher=fetch}={}){
 if(typeof baseUrl!=='string'||new URL(baseUrl).protocol!=='https:')
  throw new Error('Shared library requires HTTPS origin');
 const appOrigin=new URL(baseUrl);
 const manifestUrl=new URL('./assets/panda-shared-library/manifest-v1.json',appOrigin);
 if(manifestUrl.origin!==appOrigin.origin)throw new Error('Invalid shared library origin');
 return Object.freeze({
  async installedRelease(){
   const metadata=await task(database,[META_STORE],'readonly',tx=>tx.objectStore(META_STORE).get('current'));
   return metadata?.release||0;
  },
  async fetchManifest(){
   const res=await fetcher(manifestUrl.href,{credentials:'same-origin',redirect:'error',cache:'no-store'});
   if(!res?.ok||res.type==='opaque')throw new Error('Cannot download shared library catalog');
   const body=await res.text();
   if(body.length>100000)throw new Error('Shared library catalog too large');
   return checkSharedPandaManifest(JSON.parse(body));
  },
  async install(manifest){
   const checked=checkSharedPandaManifest(manifest);
   const current=await this.installedRelease();
   if(current>=checked.release)return {status:'already-installed',release:current,saved:0};
   // Download everything first; a failed file never leaves half-updated library.
   const cards=[];
   for(const entry of checked.entries){
    const audioBlob=await fetchApprovedPandaMp3(entry.src,{baseUrl:appOrigin.href,fetcher});
    cards.push({...entry,audioBlob,release:checked.release});
   }
   await task(database,[CARD_STORE,META_STORE],'readwrite',tx=>{
    for(const card of cards)tx.objectStore(CARD_STORE).put(card);
    tx.objectStore(META_STORE).put({id:'current',release:checked.release,issued:checked.issued});
   });
   return {status:'installed',release:checked.release,saved:cards.length};
  },
  async update(){
   const manifest=await this.fetchManifest();
   return await this.install(manifest);
  },
  async recall({topic,trigger}){
   const t=message(topic,50);
   if(!/^[a-z0-9-]+$/.test(t))throw new Error('Invalid subject');
   const normalized=normalizePandaChinese(message(trigger,500));
   const entries=await task(database,[CARD_STORE],'readonly',tx=>tx.objectStore(CARD_STORE).getAll());
   const found=entries.find(item=>item.topic===t&&normalizePandaChinese(item.trigger)===normalized);
   if(!found||found.voiceId!=='voice-093'||!(found.audioBlob instanceof Blob))return null;
   return {hanzi:found.answer,pinyin:found.pinyin,ru:found.ru,
    audioBlob:found.audioBlob,topic:found.topic,voiceId:'voice-093',source:'shared-reviewed-course',release:found.release};
  },
  async list(){
   const entries=await task(database,[CARD_STORE],'readonly',tx=>tx.objectStore(CARD_STORE).getAll());
   return entries.map(item=>({id:item.id,topic:item.topic,trigger:item.trigger,hanzi:item.answer,
    level:item.level,release:item.release})); // never expose audio/private profile in list
  },
  async clear(){
   await task(database,[CARD_STORE,META_STORE],'readwrite',tx=>{
    tx.objectStore(CARD_STORE).clear();tx.objectStore(META_STORE).clear();
   });
  }
 });
}
