/* Panda Go + Panda Street AI — opt-in shared learner facts, v1.
 * This is NOT a shared conversation log, voice library, account sync or AI training.
 * Facts are stored only in the browser on this origin. No microphone or audio data.
 * The option is OFF by default; shared devices must not enable it for multiple learners.
 */
export const PANDA_SHARED_PROFILE_KEY='pg-panda-shared-profile-v1';
export const PANDA_SHARED_PROFILE_CONSENT_KEY='pg-panda-shared-profile-consent-v1';
const RELATIVES=['哥哥','姐姐','弟弟','妹妹','爸爸','妈妈'];
const SIMPLE_FIELDS=['name','role','profession','workplace','subject','freeDay','city'];
const EMPTY=()=>({family:{},siblingAges:{}});
export const PANDA_LEARNING_PREFERENCES=Object.freeze({
 hobby:Object.freeze(['跑步','看书','听音乐','游泳']),
 studyFocus:Object.freeze(['声调','发音','语法','汉字','听力','口语'])
});
function safeStorage(storage){return storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function'}
function shortText(value,max=80){
 if(typeof value!=='string')return null;
 const clean=value.trim().normalize('NFC');
 return clean&&[...clean].length<=max?clean:null;
}
export function cleanSharedPandaProfile(source){
 const output=EMPTY();
 if(!source||typeof source!=='object'||Array.isArray(source))return output;
 for(const field of SIMPLE_FIELDS){
  const value=shortText(source[field],field==='workplace'?120:80);
  if(value)output[field]=value;
 }
 for(const [field,allowed] of Object.entries(PANDA_LEARNING_PREFERENCES)){
  if(allowed.includes(source[field]))output[field]=source[field];
 }
 for(const field of ['age','familySize']){
  const value=source[field];
  if(Number.isInteger(value)&&value>0&&value<=(field==='age'?120:30))output[field]=value;
 }
 if(source.family&&typeof source.family==='object'&&!Array.isArray(source.family)){
  for(const relative of RELATIVES){
   if(typeof source.family[relative]==='boolean')output.family[relative]=source.family[relative];
  }
 }
 if(source.siblingAges&&typeof source.siblingAges==='object'&&!Array.isArray(source.siblingAges)){
  for(const relative of RELATIVES.slice(0,4)){
   const age=source.siblingAges[relative];
   if(Number.isInteger(age)&&age>0&&age<=120&&output.family[relative]!==false){
    output.siblingAges[relative]=age;output.family[relative]=true;
   }
  }
 }
 return output;
}
export function sharedPandaMemoryEnabled(storage=globalThis.localStorage){
 try{return !!safeStorage(storage)&&storage.getItem(PANDA_SHARED_PROFILE_CONSENT_KEY)==='yes'}catch{return false}
}
export function setSharedPandaMemoryEnabled(storage,enabled){
 if(!safeStorage(storage))throw Error('Local browser storage unavailable');
 if(enabled===true){storage.setItem(PANDA_SHARED_PROFILE_CONSENT_KEY,'yes');return true}
 storage.removeItem(PANDA_SHARED_PROFILE_CONSENT_KEY);
 // Switching the option off is a privacy reset, not merely a hidden switch.
 storage.removeItem(PANDA_SHARED_PROFILE_KEY);
 return false;
}
export function readSharedPandaProfile(storage=globalThis.localStorage){
 if(!sharedPandaMemoryEnabled(storage))return EMPTY();
 try{
  const raw=storage.getItem(PANDA_SHARED_PROFILE_KEY);
  if(!raw)return EMPTY();
  const parsed=JSON.parse(raw);
  if(parsed?.version!==1)return EMPTY();
  return cleanSharedPandaProfile(parsed.profile);
 }catch{return EMPTY()}
}
export function saveSharedPandaProfile(storage,profile){
 if(!sharedPandaMemoryEnabled(storage))return false;
 const previous=readSharedPandaProfile(storage);
 const incoming=cleanSharedPandaProfile(profile);
 // Only explicit preference updates may change these fields; an older in-memory
 // legacy profile must not resurrect a preference deleted in another character.
 for(const field of Object.keys(PANDA_LEARNING_PREFERENCES))delete incoming[field];
 const combined=cleanSharedPandaProfile({
  ...previous,...incoming,
  family:{...previous.family,...incoming.family},
  siblingAges:{...previous.siblingAges,...incoming.siblingAges}
 });
 try{
  storage.setItem(PANDA_SHARED_PROFILE_KEY,JSON.stringify({version:1,profile:combined}));
  return true;
 }catch{return false}
}
export function clearSharedPandaProfile(storage=globalThis.localStorage){
 try{storage?.removeItem(PANDA_SHARED_PROFILE_KEY);return true}catch{return false}
}

export function updateSharedPandaPreference(storage,field,value){
 if(!sharedPandaMemoryEnabled(storage)||!Object.hasOwn(PANDA_LEARNING_PREFERENCES,field))return false;
 if(value!==null&&!PANDA_LEARNING_PREFERENCES[field].includes(value))return false;
 const profile=readSharedPandaProfile(storage);
 if(value===null)delete profile[field];else profile[field]=value;
 try{storage.setItem(PANDA_SHARED_PROFILE_KEY,JSON.stringify({version:1,profile}));return true;}catch{return false;}
}
