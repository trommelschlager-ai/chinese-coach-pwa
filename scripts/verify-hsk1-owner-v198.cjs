'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{PANDA_HSK1_VOICES:{female:{}}}};
vm.runInNewContext(fs.readFileSync('assets/hsk1-native-clean-v198.js','utf8'),ctx,{filename:'hsk1-native-clean-v198.js',timeout:15000});
const m=ctx.window.PANDA_HSK1_VOICES.female;
const list=['我','是','学生','我是学生','你','你好','你好！','我是学生。'];
for(const key of list){
 const data=m[key];
 assert(typeof data==='string'&&data.startsWith('data:audio/mpeg;base64,'),'Missing clean original speaker recording '+key);
 const buf=Buffer.from(data.split(',')[1],'base64');
 assert(buf.length>=5000&&buf.length<=200000,'Invalid size for '+key);
 assert(buf.slice(0,3).toString()==='ID3'||buf[0]===255,'Not a valid MP3 stream for '+key);
}
assert.strictEqual(m['你好'],m['你好！'],'The greeting must not switch audio');
assert.strictEqual(m['我是学生'],m['我是学生。'],'The full sentence must not switch audio');
console.log('PASS HSK1 owner voice v198: all 8 checked word/phrase variants from the same provided recording; tone charts still require separate owner samples.');
