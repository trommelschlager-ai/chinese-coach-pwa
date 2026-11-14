/* Run: node tests/panda-brain-v341.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../assets/panda-brain-v341.js'),'utf8');
const scope = {window:{}};
vm.runInNewContext(source,scope);
const b = scope.window.PandaBrainV341;
assert.equal(b.version,'341');
let count=0;
function check(slot,phrase,expected){
 const got=b.assess(slot,phrase);
 assert.equal(got.ok,expected,JSON.stringify({slot,phrase,got}));
 count++;
}
for(const name of ['彼得','安东','克里斯蒂安','张伟','安娜','王小明','玛丽亚','伊万','弗拉基米尔'])
 check(1,'我叫'+name,true);
for(const job of b.words.jobs) check(2,'我是'+job,true);
for(const city of ['北京','莫斯科','上海','弗拉基米尔','阿姆斯特丹','广州','伦敦'])
 check(4,'我住在'+city,true);
for(const age of ['十八','二十五','三十','四十四','六十','一百零一','十','九'])
 check(3,'我今年'+age+'岁',true);
for(const value of ['我是苹果','我是香蕉','我是水','我是北京','我是天气','我是手机','我是桌子','我是爸爸'])
 check(2,value,false);
check(1,'我叫医生',false);
check(1,'我叫苹果',false);
check(4,'我住在苹果',false);
check(4,'我住在医生',false);
check(3,'我今年几岁',false);
check(3,'我今年二百岁',false);
check(3,'我今年二十五',false);
check(0,'你好！',true);
check(0,'我很好',false);
check(2,'我是一名厨师',true);
check(2,'我没有工作',true);
check(2,'我在工厂工作',true);
check(2,'我不工作',true);
const nameAndJob=b.assess(1,'我叫克里斯蒂安，我是一名厨师。');
assert.equal(nameAndJob.ok,true);
const memory=b.memory(nameAndJob.facts);
assert.equal(memory.name,'克里斯蒂安');
assert.equal(memory.job,'厨师');
count+=3;
const withoutComma=b.assess(1,'我叫彼得我是工人');
assert.equal(withoutComma.facts.length,2);count++;
const unknown=b.assess(2,'我是烘焙师');
assert.equal(unknown.ok,false);
assert.equal(unknown.uncertain,true);count+=2;
const already=[true,true,true,false,false];
assert.equal(b.nextPending(1,already,[false,false,false,false,false]),3);count++;
assert.equal(b.ageNumber('四十四'),44);count++;
console.log('Panda Brain v341: '+count+' deterministic tests passed.');
