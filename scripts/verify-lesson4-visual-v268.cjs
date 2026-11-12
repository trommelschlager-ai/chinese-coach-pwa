'use strict';
/* v268: validate all three user-approved lesson-4 illustration treatments. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const css=fs.readFileSync('assets/hsk1-fourth-v219.css','utf8');
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const name of ['cover','celebrate','woman','man']){
 const path='assets/lesson4-v268/'+name+'.webp';
 const data=fs.readFileSync(path);
 assert(data.length>8000,'Low-quality or empty image: '+name);
 assert.equal(data.toString('ascii',0,4),'RIFF',name+' is not WebP');
 assert.equal(data.toString('ascii',8,12),'WEBP',name+' lacks WebP signature');
 assert(offline.files.includes('./'+path),name+' missing in offline asset index');
}
assert(app.includes('./assets/lesson4-v268/cover.webp'),'New lake panda is not in lesson intro');
assert(app.includes('./assets/lesson4-v268/celebrate.webp'),'New graduation panda is not in summary');
assert(app.includes('./assets/lesson4-v268/woman.webp')&&app.includes('./assets/lesson4-v268/man.webp'),'New dialogue portraits not linked');
assert(css.includes("background-image:url('./lesson4-v268/woman.webp')")&&css.includes("background-image:url('./lesson4-v268/man.webp')"),'Dialogue bubble portraits missing');
assert(!css.includes('lesson4-dialog-v266/woman.svg')&&!css.includes('lesson4-dialog-v266/man.svg'),'Defective SVGs still used in active CSS');
assert(html.includes('hsk1-fourth-v219.css?v=268')&&html.includes('hsk1-fourth-v220.js?v=268'),'Browser cache-busting missing');
assert(app.includes('PandaLesson4XiaoxiaoV265?.lookup(word)'),'Approved female Xiaoxiao audio must be preserved');
assert(app.includes("role==='male'")&&app.includes('function toggleConversation()'),'Male voice & interactive dialogue controls must remain');
assert(offline.version>=268,'Offline cache index outdated');
console.log('PASS v268: 4 sharp picture assets for 3 lesson-4 screens, dialogue intact, all offline resources indexed');
