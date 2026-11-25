import {test} from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
for(const zh of ["你明天早上做什么","你明天做什么","你今天晚上做什么","你每天早上做什么","你明天下午打算做什么呢","你明天中午要做什么","你晚上做什么","你今天想做什么","你明天上午准备做什么","你今天下午会做什么"])test('routine question: '+zh,()=>{const out=respondToNaturalStatement(zh);assert.equal(out?.kind,'question');assert.equal(out?.domain,'everyday');assert(out.spoken.pinyin);assert(out.spoken.translation);assert(lookupApprovedPandaVoice(out.reply.hanzi),'Exact registered audio: '+out.reply.hanzi);});
test('tomorrow morning screenshot',()=>{const out=respondToNaturalStatement('你明天早上做什么？');assert.equal(out.spoken.pinyin,'Nǐ míngtiān zǎoshang zuò shénme?');assert.equal(out.reply.hanzi,'我明天学中文。');});
test('affection reply need not ask name again',()=>{assert.equal(respondToNaturalStatement('我爱你').reply.hanzi,'谢谢你！我很开心！');});
