// Exact recording queue deduplicated across the actual test fixtures.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const files=['work','introduction','family','everyday'].map(x=>'../tests/panda-'+x+'-dialogue-v556.test.mjs');
const unique=new Map();
const add=(zh,awaiting,topic)=>{const r=reply(zh,{awaiting});if(!r?.reply?.hanzi||!r.reply.pinyin)return r?.next;const key=r.reply.hanzi.normalize('NFC').replace(/[\p{P}\s]/gu,'');if(!unique.has(key))unique.set(key,{...r.reply,topic,approved:lookupApprovedPandaVoice(r.reply.hanzi)?.src||null});return r.next;};
for(const file of files){
 const s=readFileSync(new URL(file,import.meta.url),'utf8');
 const matrix=JSON.parse(s.slice(s.indexOf('const matrix=')+13,s.indexOf(';\nconst chains=')));
 const cs=s.indexOf('const chains=')+13,ce=s.indexOf(';\nfor(',cs);const chains=JSON.parse(s.slice(cs,ce));
 for(const [group,items] of Object.entries(matrix))for(const item of items){const [zh,a]=Array.isArray(item)?item:[item,null];add(zh,a,group);}
 for(const chain of chains){let a=null;for(const [zh] of chain)a=add(zh,a,'context');}
}
const rows=[...unique.values()],missing=rows.filter(x=>!x.approved);
mkdirSync('qa/panda-dialogue-v556',{recursive:true});
writeFileSync('qa/panda-dialogue-v556/voice-audit.json',JSON.stringify({unique:rows.length,approved:rows.length-missing.length,missing:missing.length,rows},null,2));
writeFileSync('qa/panda-dialogue-v556/voice-missing.txt',missing.map((x,i)=>String(i+1).padStart(3,'0')+' | '+x.hanzi+' | '+x.pinyin+' | '+x.ru).join('\n')+'\n');
console.log('Exact approved replies:',rows.length-missing.length,'/',rows.length,'; need recording:',missing.length);
