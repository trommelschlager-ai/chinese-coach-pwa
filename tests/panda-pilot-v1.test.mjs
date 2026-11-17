import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync(new URL('../pilot.html',import.meta.url),'utf8');
const links=[
 './hsk1-map.html',
 './hsk2-life-course.html',
 './panda-voice-pilot.html'
];
function setup(){
 const dom=new JSDOM(html,{url:'https://trommelschlager-ai.github.io/chinese-coach-pwa/pilot.html',
  runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 const script=[...w.document.querySelectorAll('script')].at(-1);
 assert(script?.textContent);
 w.eval(script.textContent);
 return {dom,w,doc:w.document};
}
test('pilot page is accessible but does not pretend to protect public course content',()=>{
 assert.match(html,/name="robots" content="noindex,nofollow"/);
 assert.match(html,/не закрытая система авторизации/i);
 assert.match(html,/без регистрации и платежей/i);
 assert(!/<input[^>]+type=["']password/i.test(html));
});
test('three pilot links open the real approved HSK1, HSK2 and Panda AI routes',()=>{
 const {dom,doc}=setup();
 const hrefs=[...doc.querySelectorAll('.path a')].map(a=>a.getAttribute('href'));
 assert.deepEqual(hrefs,links);
 for(const link of hrefs){
  assert(fs.existsSync(new URL('../'+link.replace(/^\.\//,''),import.meta.url)),link+' missing');
 }
 assert(doc.querySelectorAll('[data-task]').length===8);
 dom.window.close();
});
test('feedback is only generated locally, no request or telemetry',()=>{
 assert(!/\bfetch\s*\(/.test(html));
 assert(!/XMLHttpRequest|sendBeacon|localStorage|sessionStorage|<form[^>]+action=/i.test(html));
 const {dom,w,doc}=setup();
 doc.getElementById('area').value='Panda AI';
 doc.getElementById('rating').value='4/5';
 doc.getElementById('issue').value='Не работает микрофон';
 doc.getElementById('device').value='Android, Chrome';
 doc.getElementById('detail').value='Панда ответила текстом, но звук не включился.';
 doc.querySelectorAll('[data-task]')[0].checked=true;
 const result=doc.getElementById('feedback-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(result,false,'the native form submit should be cancelled');
 assert(doc.getElementById('report').classList.contains('show'));
 const text=doc.getElementById('report-text').value;
 for(const item of ['Panda AI','4/5','Не работает микрофон','Android, Chrome','1/8','звук не включился'])assert(text.includes(item),item);
 dom.window.close();
});
test('feedback does not include unexpected identifiers and can be selected for manual copy',async()=>{
 const {dom,w,doc}=setup();
 doc.getElementById('feedback-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 doc.getElementById('copy').click();
 // Clipboard API may not exist on devices, the fallback is explicit manual copy.
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.match(doc.getElementById('feedback-status').textContent,/копир|скопир/i);
 assert(!doc.getElementById('report-text').value.includes('https://example.test'));
 dom.window.close();
});
