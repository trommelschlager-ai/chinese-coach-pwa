#!/usr/bin/env node
/* Build an audio index only after all 42 human-reviewed clips exist. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/panda-grammar-voice-manifest-v451.json'),'utf8'));
assert.equal(data.items.length,42);
const norm=s=>String(s).replace(/[\s。，！？?!,]/g,'');
const keys=new Set();const mapping={};
for(const item of data.items){
 const expected='g'+String(item.id).padStart(3,'0')+'.mp3';
 assert.equal(item.file,expected);
 const key=norm(item.hanzi);assert.ok(!keys.has(key),'Duplicate phrase: '+key);keys.add(key);
 const full=path.join(root,'assets/panda-grammar-voice-v451',expected);
 assert.ok(fs.existsSync(full),'Missing MP3: '+expected);
 const bytes=fs.readFileSync(full);
 assert.ok(bytes.length>3000,'Audio file suspiciously short: '+expected);
 assert.ok(bytes.toString('ascii',0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224,'Not an MP3: '+expected);
 mapping[key]='./assets/panda-grammar-voice-v451/'+expected;
}
const header='/* Generated index from user-approved speech. Human listening and tone QA required. */\n';
const content=header+'export const PANDA_GRAMMAR_AUDIO_V451=Object.freeze('+JSON.stringify(mapping,null,2)+');\n';
const target=path.join(root,'assets/panda-grammar-voice-v451.mjs');
fs.writeFileSync(target,content,'utf8');
console.log('Created index for '+keys.size+' exact MP3 files at '+target);
console.log('No MP3 was synthesized or altered. Check every clip by listening before integration.');
