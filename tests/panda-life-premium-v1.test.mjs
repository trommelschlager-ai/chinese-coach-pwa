import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {availableLife,startLife,lifeTurn,submitLife} from '../assets/panda-life-premium-v1.mjs';
test('lesson gating and no fabricated scoring',()=>{assert.equal(availableLife([1]).length,1);assert.throws(()=>startLife('shopping',[1]));const s=startLife('introduction',[1]);const u=submitLife(s,{text:'我来自吉尔吉斯斯坦。',method:'typed'});assert.equal(u.status,'unassessed');assert.equal(u.state.index,0);const r=submitLife(s,{text:'我来自俄罗斯',method:'recognition'});assert.equal(r.state.index,1);assert.equal(r.toneAssessment,null);});
test('complete each scenario and verify audio file presence',()=>{for(const scenario of availableLife([1,8])){let s=startLife(scenario.id,[1,8]);while(!s.done){const turn=lifeTurn(s);for(const l of [turn.prompt,...turn.answers])assert.ok(existsSync(new URL('../'+l.audio.replace(/^\.\//,''),import.meta.url)),l.audio);s=submitLife(s,{text:turn.answers[0].zh,method:'choice'}).state;}assert.equal(s.results.length,3);assert.equal(lifeTurn(s),null);}});
