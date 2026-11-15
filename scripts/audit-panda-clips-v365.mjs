import fs from 'node:fs';
import vm from 'node:vm';
import {PANDA_CLIPS} from '../assets/panda-voice-clips-v365.mjs';
import {PILOT_AUDIO,lookupPandaVoiceClip,recordedCoursePhrases} from '../assets/panda-live-audio.mjs';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/hsk2-user-voice/phrase-index-v332.js','utf8'),ctx);globalThis.window=ctx.window;
const phrases=[...new Set([...PANDA_CLIPS.map(x=>x.zh),...Object.keys(PILOT_AUDIO),...recordedCoursePhrases()])];
const entries=phrases.map(zh=>({zh,...lookupPandaVoiceClip(zh)}));
for(const e of entries){if(!e.src||!fs.existsSync(e.src)||e.start!==0||e.end!==null)throw Error('Invalid playable phrase '+JSON.stringify(e));}
fs.mkdirSync('qa/panda-v365',{recursive:true});fs.writeFileSync('qa/panda-v365/inventory.json',JSON.stringify(entries,null,2));
console.log(`${entries.length} exact phrase mappings, ${new Set(entries.map(x=>x.src)).size} available files; no runtime ranges.`);
