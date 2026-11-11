'use strict';
/* Idempotent one-time installer for user-supplied Panda Go Lesson 4 Xiaoxiao MP3. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root='assets/lesson4-xiaoxiao-v265';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
assert(manifest.version===265&&manifest.lesson===4&&manifest.voice==='Xiaoxiao');
assert(manifest.clips.length===25);
const names=['星期','星期一','星期二','星期三','星期四','星期五','星期六','星期天','星期日','今天','明天','昨天','几','日','今天星期几？','明天星期几？','今天星期五。','明天星期六。','昨天星期二。','今天星期三。','今天星期一。','今天是星期五。','你星期几有空？','我星期六有空。','我们星期六一起去看电影吧！'];
function assert(ok,m='Incorrect audio manifest'){if(!ok)throw new Error(m)}
manifest.clips.forEach((clip,i)=>{
 assert(clip.text===names[i],`Wrong clip order ${i}: ${clip.text}`);
 const file=path.join(root,clip.file),data=fs.readFileSync(file);
 assert(data.length>1800&&data.length===clip.bytes,`Bad audio size ${clip.text}`);
 assert(crypto.createHash('sha256').update(data).digest('hex')===clip.sha256,`MP3 checksum failed ${clip.text}`);
});
function edit(filename,transform){const old=fs.readFileSync(filename,'utf8'),next=transform(old);assert(next&&typeof next==='string',`Cannot transform ${filename}`);if(old!==next){fs.writeFileSync(filename,next);console.log('Updated:',filename)}else console.log('Already updated:',filename)}
function replaceOnce(data,needle,replacement,subject){if(data.includes(replacement))return data;assert(data.includes(needle),`Cannot locate ${subject}: ${needle.slice(0,100)}`);return data.replace(needle,replacement)}
edit('assets/hsk1-fourth-v220.js',text=>{
 text=replaceOnce(text,
  ': (window.PandaCleanAudioV250?.lookup(word)||',
  ': (window.PandaLesson4XiaoxiaoV265?.lookup(word)||window.PandaCleanAudioV250?.lookup(word)||',
  'female audio routing');
 text=text.replace('Подключены 22 оригинальные записи китаянки для слов и фраз урока 4. Для отсутствующих в этом наборе фраз используются ранее подготовленные записи Yue Tan / Shtooka',
  'Все 25 слов и фраз словаря урока 4 записаны единым голосом Xiaoxiao. Мужская реплика в диалоге оставлена отдельной. Резервные записи Yue Tan / Shtooka');
 text=text.replace('Словарь из 25 слов и фраз. Подключён дополнительный набор из 22 записей китаянки; для некоторых выражений используются резервные образцы.',
  'Все 25 слов и фраз записаны голосом Xiaoxiao.');
 text=text.replace('Цельная озвучка ожидается.','Нажми на динамик, чтобы послушать каждую фразу.');
 text=text.replace("'<small>'+x[2]+'</small></div>').join('')", "'<small>'+x[2]+'</small>'+compactAudioButton(x[0])+'</div>').join('')");
 text=text.replace('Цельная запись 今天是星期五。 уже получена от приглашённой носительницы.',
  'Цельная запись 今天是星期五。 озвучена тем же голосом Xiaoxiao.');
 return text;
});
edit('hsk1-fourth-v214.html',text=>{
 text=replaceOnce(text,
  '<script src="./assets/hsk1-fourth-v220.js?v=250"></script>',
  '<script src="./assets/lesson4-xiaoxiao-v265.js?v=265"></script>\n<script src="./assets/hsk1-fourth-v220.js?v=265"></script>',
  'lesson 4 HTML');
 if(!text.includes('name="panda-go-lesson4-audio"'))text=text.replace('<title>', '<meta name="panda-go-lesson4-audio" content="Xiaoxiao v265">\n<title>');
 if(!text.includes('serviceWorker.getRegistration().then'))text=text.replace('</body>',`<script>if('serviceWorker' in navigator)navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{});</script>\n</body>`);
 return text;
});
edit('hsk1-l4-cards.html',text=>{
 text=replaceOnce(text,
  '<script src="./assets/hsk1-weekdays-audio-map-v214.js?v=214"></script><script>',
  '<script src="./assets/hsk1-weekdays-audio-map-v214.js?v=214"></script><script src="./assets/lesson4-xiaoxiao-v265.js?v=265"></script><script>',
  'cards HTML');
 text=replaceOnce(text,
  'const file=(word)=>owner[word]||',
  'const file=(word)=>window.PandaLesson4XiaoxiaoV265?.lookup(word)||owner[word]||',
  'cards audio routing');
 if(!text.includes('name="panda-go-lesson4-audio"'))text=text.replace('<title>', '<meta name="panda-go-lesson4-audio" content="Xiaoxiao v265"><title>');
 return text;
});
edit('assets/offline-pack.json',text=>{
 const pack=JSON.parse(text),prefix='./'+root+'/';
 pack.version=265;
 for(let i=0;i<25;i++){const key=prefix+String(i).padStart(3,'0')+'.mp3';if(!pack.files.includes(key))pack.files.push(key)}
 for(const key of [prefix+'manifest.json','./assets/lesson4-xiaoxiao-v265.js?v=265','./assets/hsk1-fourth-v220.js?v=265','./hsk1-fourth-v214.html?v=265','./hsk1-l4-cards.html?v=265'])if(!pack.files.includes(key))pack.files.push(key);
 return JSON.stringify(pack,null,2)+'\n';
});
edit('sw.js',text=>text.replace(/^const CACHE='[^']+';/m,"const CACHE='chinese-coach-pwa-v265-lesson4-xiaoxiao';"));
const verify='scripts/verify-hsk1-fourth-v216.cjs';
edit(verify,text=>text.replace("assert(html.includes('hsk1-fourth-v220.js?v=250'))","assert(html.includes('hsk1-fourth-v220.js?v=265'))"));
const qaWorkflow='.github/workflows/course-qa.yml';
edit(qaWorkflow,text=>{
 if(text.includes('      - run: node scripts/verify-hsk1-lesson4-xiaoxiao-v265.cjs'))return text;
 const line='      - run: node scripts/verify-hsk1-lesson4-xiaoxiao-v265.cjs\n';
 const anchor='      - run: node scripts/verify-hsk1-lesson2-xiaoxiao-v261.cjs';
 if(text.includes(anchor))return text.replace(anchor,line+anchor);
 // If the upstream workflow has changed, add test at the start of the regression job instead.
 const alt='      - run: npm run check:pronunciation';
 assert(text.includes(alt),'Cannot identify QA workflow insertion point');
 return text.replace(alt,line+alt);
});
console.log('Installed 25 Xiaoxiao voice clips, preserved male dialog audio. Manual tone review pending.');
