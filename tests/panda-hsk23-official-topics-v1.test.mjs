import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PANDA_HSK23_OFFICIAL_TOPIC_GROUPS,pandaHSKTopicGroups,pandaHSKTopicStats} from '../assets/panda-hsk23-official-topics-v1.mjs';
import {HSK2_TOPICS} from '../assets/panda-hsk2-brain-data-v1.mjs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('official HSK 3.0 topic counts are preserved exactly, and entries are unique',()=>{
 assert.equal(PANDA_HSK23_OFFICIAL_TOPIC_GROUPS.length,40);
 assert.deepEqual(pandaHSKTopicStats(2),{level:2,areaCount:5,groupCount:18,subtopicCount:34});
 assert.deepEqual(pandaHSKTopicStats(3),{level:3,areaCount:6,groupCount:22,subtopicCount:54});
 assert.equal(new Set(PANDA_HSK23_OFFICIAL_TOPIC_GROUPS.map(row=>row.id)).size,40);
 for(const row of PANDA_HSK23_OFFICIAL_TOPIC_GROUPS){
  assert(row.areaCn&&row.topicCn&&row.topicRu&&row.subtopicsCn.length);
  assert(['syllabus-only','related-practice'].includes(row.status));
  assert(Object.isFrozen(row.subtopicsCn));
 }
});

test('HSK3 remains an informational syllabus, never a fake unlocked dialogue',()=>{
 assert.equal(pandaHSKTopicGroups(3).length,22);
 for(const row of pandaHSKTopicGroups(3)){
  assert.equal(row.status,'syllabus-only');
  assert.deepEqual(row.relatedPandaTopicIds,[]);
 }
});

test('related HSK2 catalogue links point only to real existing Panda questions',()=>{
 const byId=new Map(HSK2_TOPICS.map(t=>[t.id,t]));
 let referenced=0;
 for(const row of pandaHSKTopicGroups(2))for(const id of row.relatedPandaTopicIds){
  referenced++;
  assert(id>=101&&id<=110);
  assert(byId.get(id)?.questions?.length,'Missing actual question list for '+id);
 }
 assert(referenced>8);
});

test('Panda topic drawer links the syllabus without changing approved lesson dialogue engine',()=>{
 const ui=read('assets/panda-hsk2-preview-ui-v1.mjs');
 assert.match(ui,/panda-hsk23-official-topics-v1\.mjs\?v=1/);
 assert.match(ui,/function showSyllabusCatalog\(level=2\)/);
 assert.match(ui,/HSK 3: темы внесены в программу/);
 assert.match(ui,/showTopicDetails\(id\)/);
 const online=read('panda-voice-pilot.html'),preview=read('panda-ai-hsk2-preview.html');
 for(const html of [online,preview])assert(html.includes('panda-hsk2-preview-ui-v1.mjs?v=526'));
 const sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
 assert(sw.includes('panda-hsk23-official-topics-v1.mjs?v=1'));
 assert(pack.files.includes('./assets/panda-hsk23-official-topics-v1.mjs?v=1'));
 assert(pack.files.includes('./assets/panda-hsk2-preview-ui-v1.mjs?v=526'));
 assert.equal(pack.version,526);
 assert.equal(Number(sw.match(/^const CACHE='chinese-coach-pwa-v(\d+)-/m)?.[1]),pack.version);
});
