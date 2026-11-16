'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const w={};
for(const p of ['assets/hsk2-life-course-data-v1.js','assets/hsk2-user-voice/phrase-index-v332.js','assets/hsk2-audio-v330.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,p),'utf8'),{window:w},{filename:p});
}
const norm=s=>String(s??'').replace(/[。？！!?，,\\s]/g,'');
const topics=w.PandaLifeCourseV1.topics;
const known=new Set(w.PandaHsk2AudioV330.segments.map(norm));
assert.equal(topics.length,10);
assert.equal(topics.reduce((n,t)=>n+t.words.length,0),200);
assert.equal(topics.reduce((n,t)=>n+t.scenes.length*3,0),90);
assert(w.PandaUserVoiceIndexV332.clips.length>=155,'Original source index unexpectedly lost rows');
let wordCoverage=0,utteranceCoverage=0,missingWords=[],missingSentences=[];
for(const t of topics){
 for(const row of t.words){
  const exists=known.has(norm(row[0]));
  if(exists)wordCoverage++;else missingWords.push(row[0]);
 }
 for(const scene of t.scenes){
  for(const zh of [scene[2],scene[5],scene[8]]){
   if(known.has(norm(zh)))utteranceCoverage++;else missingSentences.push(zh);
  }
 }
}
assert(wordCoverage>=9,'Previously confirmed exact word matches were lost');
assert(utteranceCoverage>=4,'Previously confirmed exact phrase matches were lost');
const uniqueMissing=new Set(missingSentences.map(norm));
assert.equal(known.has(norm('宇宙飞船')),false,'Never claim unavailable arbitrary speech');
console.log(JSON.stringify({course:'HSK2 My Life',words:{available:wordCoverage,total:200},
 utterancePositions:{available:utteranceCoverage,total:90},missingUniqueSentences:uniqueMissing.size,
 missingWords:missingWords.length},null,2));
