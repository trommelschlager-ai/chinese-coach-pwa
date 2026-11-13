'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/panda-hsk2-seed-v303.json'),'utf8'));
assert.equal(data.schemaVersion,303);
assert.equal(data.state,'draft_content_only_not_enabled');
assert.equal(data.safeguards.neverImportToLiveHsk1,true);
assert.equal(data.safeguards.preserveExistingVoices,true);
assert.equal(data.safeguards.paidCourseAccessMustBeImplementedSeparately,true);
assert.equal(data.sections.length,7);
assert.equal(data.targetNewLevel2Vocabulary,200);
const words = new Set();
let bridge=0,candidate=0,dialogs=0,questions=0,grammar=0;
for (const [i,section] of data.sections.entries()){
 assert.equal(section.id,i+1);
 assert(section.title&&section.grammar.length&&section.dialogue.length===2);
 assert(section.question.hanzi&&section.question.pinyin&&section.question.ru);
 questions++;dialogs+=section.dialogue.length;grammar+=section.grammar.length;
 for(const word of section.vocabulary){
  assert(word.hanzi&&word.pinyin&&word.ru&&word.pos&&word.reviewStatus==='preliminary');
  assert(!words.has(word.hanzi), 'Duplicate '+word.hanzi);words.add(word.hanzi);
  assert.equal(word.audioKey,null,word.hanzi+' must not invent audio');
  assert(/[\u00C0-\u01DC]/u.test(word.pinyin)||word.pinyin==='guo'||word.pinyin==='zhe','Missing tone-marked pinyin for '+word.hanzi);
  if(section.kind==='hsk1_bridge')bridge++;else candidate++;
 }
 for(const entry of [...section.dialogue,section.question,...section.grammar.map(x=>x.example)]){
  assert(entry.hanzi&&entry.pinyin&&entry.ru);
  assert.equal(entry.audioKey,null,'Do not invent MP3 in draft HSK2');
 }
}
assert.equal(bridge,4);
assert.equal(candidate,36);
assert.equal(dialogs,14);
assert.equal(questions,7);
assert.equal(grammar,9);
assert.equal(words.size,40);
for(const file of ['panda-voice-pilot.html','assets/panda-brain-hsk1-v302.mjs','assets/panda-live-screen-v270.mjs','sw.js']){
 assert(!fs.readFileSync(path.join(root,file),'utf8').includes('panda-hsk2-seed-v303'),'Draft HSK2 imported by live app: '+file);
}
console.log('PASS Panda HSK2 seed v303: 7 sections, 4 bridging HSK1 + 36 candidate HSK2 words, 9 grammar examples, 14 dialogue lines, 7 questions, no invented audio, no live import.');
