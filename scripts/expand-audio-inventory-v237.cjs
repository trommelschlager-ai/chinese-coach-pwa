'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const w={};for(const f of ['hsk1-voices-map-v160.js','hsk1-native-human-map-v167.js','hsk1-lesson2-audio-v208.js','hsk1-numbers-audio-map-v213.js','hsk1-weekdays-audio-map-v214.js','owner-audio-v237.js','hsk1-foundations-data-v152.js'])vm.runInNewContext(fs.readFileSync('assets/'+f,'utf8'),{window:w});
const raw=JSON.parse(fs.readFileSync('/tmp/panda-audio-sources.json')),rows=[];
const routes={...w.PANDA_HSK1_VOICES.female,...w.PANDA_HSK1_NATIVE_HUMAN_V167,...w.PANDA_HSK1_L2_ONE_VOICE_V208,...w.PANDA_HSK1_L3_CLEAN_V213,...w.PandaOwnerAudio.clips};
for(const [phrase,originalSource] of [...Object.entries(routes),...Object.entries(w.PANDA_HSK1_VOICES.male).map(([p,s])=>[p+'|male',s])]){
 const male=phrase.endsWith('|male'),text=phrase.replace(/\|male$/,'');const src=(!male&&w.PandaOwnerAudio.lookup(text))||originalSource;const id=crypto.createHash('sha256').update(src).digest('hex');raw[id]=src;
 if(src.startsWith('data:'))fs.writeFileSync('/tmp/panda-audit/'+id.slice(0,16)+'.mp3',Buffer.from(src.split(',')[1],'base64'));
 rows.push({phrase:text,role:male?'male':'female',source:src.includes('owner-clean-v237')?'approved original speaker':src.includes('numbers-clean')?'compiled numbers, other speaker':'existing fallback',path:src,scope:'available route inventory; includes dynamic numbers, review and exercise variants',pronunciation:'listening review required'});
}
fs.writeFileSync('/tmp/panda-audio-sources.json',JSON.stringify(raw));fs.writeFileSync('qa/v237/full-route-inventory.json',JSON.stringify(rows,null,2)+'\n');console.log(rows.length+' route variants inventoried.');
