import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PANDA_SHARED_PROFILE_KEY,PANDA_SHARED_PROFILE_CONSENT_KEY,
 cleanSharedPandaProfile,sharedPandaMemoryEnabled,
 setSharedPandaMemoryEnabled,readSharedPandaProfile,
 saveSharedPandaProfile,clearSharedPandaProfile,updateSharedPandaPreference
} from '../assets/panda-cross-character-memory-v1.mjs';
import {mergePandaFacts435} from '../assets/panda-natural-memory-v435.mjs';

function storage(){
 const map=new Map();
 return {
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key),
  dump:()=>Object.fromEntries(map)
 };
}

test('shared learner memory is off by default and no private facts are saved',()=>{
 const s=storage();
 assert.equal(sharedPandaMemoryEnabled(s),false);
 assert.equal(saveSharedPandaProfile(s,{name:'安东'}),false);
 assert.deepEqual(readSharedPandaProfile(s),{family:{},siblingAges:{}});
 assert.equal(s.getItem(PANDA_SHARED_PROFILE_KEY),null);
});
test('verified Panda AI facts are available to Street using the same browser profile',()=>{
 const s=storage();setSharedPandaMemoryEnabled(s,true);
 const fact={known:true,fact:{name:'安东'},family:{present:['哥哥']}};
 const panda=mergePandaFacts435({family:{}},fact);
 assert.equal(saveSharedPandaProfile(s,panda),true);
 assert.deepEqual(readSharedPandaProfile(s).family,{哥哥:true});
 assert.equal(readSharedPandaProfile(s).name,'安东');
 const street=mergePandaFacts435(readSharedPandaProfile(s),{
  known:true,fact:{profession:'老师',relative:'哥哥',relativeAge:35}
 });
 saveSharedPandaProfile(s,street);
 assert.equal(readSharedPandaProfile(s).profession,'老师');
 assert.equal(readSharedPandaProfile(s).siblingAges.哥哥,35);
});
test('a corrected absent sibling clears stale age across characters',()=>{
 const s=storage();setSharedPandaMemoryEnabled(s,true);
 saveSharedPandaProfile(s,{family:{妹妹:true},siblingAges:{妹妹:18}});
 const corrected=mergePandaFacts435(readSharedPandaProfile(s),{known:true,family:{absent:'妹妹'}});
 saveSharedPandaProfile(s,corrected);
 assert.equal(readSharedPandaProfile(s).family.妹妹,false);
 assert.equal(readSharedPandaProfile(s).siblingAges.妹妹,undefined);
});
test('only a small allowlist can enter persistent memory (no chat, MP3, tokens)',()=>{
 const p=cleanSharedPandaProfile({
  name:'安东',age:44,history:[{who:'you',hanzi:'秘密'}],
  utterance:'private voice text',audioBlob:{binary:'DATA'},apiKey:'SENSITIVE',
  family:{哥哥:true,evil:'x'},siblingAges:{哥哥:45,妹妹:999},
  __proto__:{polluted:true}
 });
 assert.deepEqual(Object.keys(p).sort(),['age','family','name','siblingAges']);
 assert.deepEqual(p.family,{哥哥:true});
 assert.deepEqual(p.siblingAges,{哥哥:45});
});
test('disabling memory clears saved facts and consent',()=>{
 const s=storage();setSharedPandaMemoryEnabled(s,true);saveSharedPandaProfile(s,{name:'安东'});
 assert.equal(s.getItem(PANDA_SHARED_PROFILE_CONSENT_KEY),'yes');
 setSharedPandaMemoryEnabled(s,false);
 assert.equal(s.getItem(PANDA_SHARED_PROFILE_KEY),null);
 assert.equal(sharedPandaMemoryEnabled(s),false);
});
test('corrupt data is ignored and can be deleted',()=>{
 const s=storage();setSharedPandaMemoryEnabled(s,true);
 s.setItem(PANDA_SHARED_PROFILE_KEY,'not-json');
 assert.deepEqual(readSharedPandaProfile(s),{family:{},siblingAges:{}});
 assert.equal(clearSharedPandaProfile(s),true);
 assert.equal(s.getItem(PANDA_SHARED_PROFILE_KEY),null);
});

test('preference changes are allowlisted, consent-gated and cannot be resurrected by stale legacy writes',()=>{
 const s=storage();assert.equal(updateSharedPandaPreference(s,'hobby','跑步'),false);
 setSharedPandaMemoryEnabled(s,true);assert.equal(updateSharedPandaPreference(s,'hobby','跑步'),true);
 assert.equal(updateSharedPandaPreference(s,'studyFocus','声调'),true);
 assert.equal(updateSharedPandaPreference(s,'hobby','private raw text'),false);
 const stale=readSharedPandaProfile(s);assert.equal(stale.hobby,'跑步');
 assert.equal(updateSharedPandaPreference(s,'hobby',null),true);
 saveSharedPandaProfile(s,{...stale,name:'安东'});
 assert.equal(readSharedPandaProfile(s).hobby,undefined);assert.equal(readSharedPandaProfile(s).studyFocus,'声调');
 assert.equal(readSharedPandaProfile(s).name,'安东');
 setSharedPandaMemoryEnabled(s,false);assert.equal(readSharedPandaProfile(s).studyFocus,undefined);
});
