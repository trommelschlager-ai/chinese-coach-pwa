'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root,'hsk2-lesson3-work-study-preview.html'),'utf8');
const backup = fs.readFileSync(path.join(root,'hsk2-lesson3-standard-v536.html'),'utf8');
const css = fs.readFileSync(path.join(root,'assets/hsk2-lesson3-refinements-v537.css'),'utf8');

test('original approved reference poster is used as a proportion-preserving static artwork',()=>{
  const image = fs.readFileSync(path.join(root,'assets/hsk2-lesson3-cover-photo5-20261121.jpg'));
  assert(image.length > 200000);
  assert.equal(image[0],0xff);assert.equal(image[1],0xd8);
  for(const page of [html,backup]){
    assert(page.includes('src="./assets/hsk2-lesson3-cover-photo5-20261121.jpg"'));
    assert(page.includes('class="l3-poster-start" data-step="2"'));
    assert(page.includes('class="l3-poster-back"'));
    assert(page.includes('hsk2-lesson3-refinements-v537.css?v=537'));
  }
  assert(css.includes('object-fit:contain'));
  assert(css.includes('aspect-ratio:694/1232'));
});

test('vocabulary, fallback layout and story images match the four targeted fixes',()=>{
  assert(css.includes('grid-template-columns:clamp(61px,17.3vw,71px)'));
  assert(css.includes('grid-template-columns:clamp(55px,16vw,68px)'));
  assert(css.includes('object-fit:cover'));
  assert(!html.includes('practice-fallback-note">'));
  assert(html.includes('tone-tabs panel'));
  assert(html.includes('tone-meter-v5.js'));
  assert(html.includes('30 мини-тестов'));
});

test('both versions remain valid JavaScript and no lesson 1 audio words were substituted',()=>{
  for(const page of [html,backup]){
    const chunks=[...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(m=>!m[1].includes('src='));
    assert(chunks.length>=2);
    for(const m of chunks)assert.doesNotThrow(()=>new vm.Script(m[2]));
    assert(page.includes('const words = ['));
    assert(page.includes("zh:'公司',py:'gōngsī'"));
    assert(page.includes("zh:'学校',py:'xuéxiào'"));
  }
});
