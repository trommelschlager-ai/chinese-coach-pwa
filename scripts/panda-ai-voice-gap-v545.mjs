// Panda AI v545: one-command audit of the exact approved MP3 for each queued reply.
// Usage:
//   node scripts/panda-ai-voice-gap-v545.mjs
//   node scripts/panda-ai-voice-gap-v545.mjs --raw  # only missing Chinese lines to record
//   node scripts/panda-ai-voice-gap-v545.mjs --json # exact structured report
import {readFileSync} from 'node:fs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const queue=JSON.parse(readFileSync(new URL('../docs/panda-ai-voice-queue-v545.json',import.meta.url),'utf8'));
const reviewed=queue.tracks.map(t=>{
 const existing=lookupApprovedPandaVoice(t.reply);
 return {...t,existingApprovedClip:existing?.src||null,needsRecording:!existing};
});
const unique=[...new Map(reviewed.map(x=>[x.reply,x])).values()];
const missing=unique.filter(x=>x.needsRecording);
if(process.argv.includes('--raw')){
 for(const x of missing)console.log(x.reply);
}else if(process.argv.includes('--json')){
 console.log(JSON.stringify({reviewed,uniqueTotal:unique.length,missingTotal:missing.length},null,2));
}else{
 console.log('Panda AI approved exact-match audio audit');
 console.log('Recorded exact matches:',unique.length-missing.length,'of',unique.length);
 console.log('Need a new reviewed MP3:',missing.length);
 for(const x of unique)console.log(x.id+' | '+(x.needsRecording?'RECORD':'EXISTING '+x.existingApprovedClip)+' | '+x.reply+' | '+x.pinyin);
 console.log('Save each new clip separately, verify pronunciation/tone/quality, then register exact Chinese text in the approved Panda AI registry.');
}
