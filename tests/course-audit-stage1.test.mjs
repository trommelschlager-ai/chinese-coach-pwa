import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const app = read('assets/hsk2-life-course-app-v1.js');
const source = app.slice(app.indexOf('function mainLessonProgress(){'), app.indexOf('function viewMap('));
const evaluate = new Function('localStorage', source+'\nreturn mainLessonProgress();');
const progress = storage => evaluate({getItem: k => JSON.stringify(storage[k] ?? null)});
const complete = {quiz:[[true,true,true,true,true,true],[],[],[],[]],heardWords:[0,1,2,3,4,5],grammarDone:true,dayDone:true,mic:[0,1,2],selfSpoken:[3,4,5],chat:[1,2,3]};

test('fresh HSK2 progress remains empty', () => assert.deepEqual(progress({}),Array(10).fill(false)));
test('lesson 3 completion uses its actual index', () => {
  assert.equal(progress({'pg-hsk2-lesson3-preview-v1':{completed:[2]}})[2],true);
  assert.equal(progress({'pg-hsk2-lesson3-preview-v1':{completed:[0]}})[2],false);
});
test('six required questions suffice for the first three lessons', () => {
  for (const [i,key] of ['panda-go-hsk2-about-me-v1','panda-go-hsk2-lesson1-word-flow-review-v1','panda-go-hsk2-lesson3-standard-v1'].entries())
    assert.equal(progress({[key]:complete})[i],true);
});
test('incomplete core, grammar or speaking is not a completed lesson', () => {
  const key='panda-go-hsk2-lesson3-standard-v1';
  for (const incomplete of [{...complete,grammarDone:false},{...complete,quiz:[[true,true,false,true,true,true]]},{...complete,selfSpoken:[]}])
    assert.equal(progress({[key]:incomplete})[2],false);
});
test('HSK1 pronoun source parses and contains both plural forms', () => {
  const js=read('assets/hsk1-second-v203.js');
  assert.doesNotThrow(()=>new Function(js));
  const vocab=js.slice(js.indexOf('const vocab='),js.indexOf('const prompts='));
  const v=new Function(vocab+'return {vocab,newWords}')();
  for(const word of ['他们','她们']) {
    assert.equal(v.vocab[word][0],'tāmen');
    assert.ok(v.newWords.includes(word));
  }
});
test('December quiz uses the syllable-separating apostrophe', () => {
  const js=read('assets/hsk1-fifth-v227.js');
  assert.doesNotThrow(()=>new Function(js));
  assert.ok(!js.includes('shíèr yuè'));
});
