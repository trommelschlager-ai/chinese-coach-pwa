'use strict';
/* Install eight user-supplied grandfather/grandmother recordings into the active lesson 6. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = 'assets/lesson6-grandparents-v275';
const manifest = JSON.parse(fs.readFileSync(folder + '/manifest.json', 'utf8'));
const phrases = ['爷爷','奶奶','外公','外婆','这是我爷爷。','这是我奶奶。','这是我外公。','这是我外婆。'];
assert.equal(manifest.clips.length, 8);
for (let i = 0; i < 8; i++) {
  const e = manifest.clips[i];
  const bytes = fs.readFileSync(path.join(folder, e.file));
  assert.equal(e.hanzi, phrases[i]);
  assert.equal(bytes.length, e.bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), e.sha256);
}
const clips = Object.fromEntries(manifest.clips.map(e => [e.hanzi, './' + folder + '/' + e.file]));
const mapJS = `/* Panda Go v275: eight complete Xiaoxiao recordings for grandparents. */
(()=>{'use strict';
const clips=Object.freeze(${JSON.stringify(clips, null, 2)});
const norm=s=>String(s??'').normalize('NFC').trim().replace(/[。！？!?，,\\s]+/g,'');
const plain=Object.freeze(Object.fromEntries(Object.entries(clips).map(([k,v])=>[norm(k),v])));
window.PandaLesson6GrandparentsV275=Object.freeze({clips,lookup(hz){return clips[hz]||plain[norm(hz)]||null}});
})();
`;
fs.writeFileSync('assets/lesson6-grandparents-v275.js', mapJS);
function change(file, oldStr, newStr) {
  const oldFile = fs.readFileSync(file, 'utf8');
  if (oldFile.includes(newStr)) return;
  assert(oldFile.includes(oldStr), 'Original anchor missing in ' + file + ': ' + oldStr.slice(0, 100));
  fs.writeFileSync(file, oldFile.replace(oldStr, newStr));
}
const app = 'assets/panda-go-companion-v231.js';
change(app, 'const words=topic.words.slice();', `const words=topic.words.slice();
const grandparents=Object.freeze([
 ['爷爷','yéye','дедушка по отцу','👴'],
 ['奶奶','nǎinai','бабушка по отцу','👵'],
 ['外公','wàigōng','дедушка по матери','👴'],
 ['外婆','wàipó','бабушка по матери','👵']
]);
const grandparentExamples=Object.freeze([
 ['这是我爷爷。','Zhè shì wǒ yéye.','Это мой дедушка по отцу.'],
 ['这是我奶奶。','Zhè shì wǒ nǎinai.','Это моя бабушка по отцу.'],
 ['这是我外公。','Zhè shì wǒ wàigōng.','Это мой дедушка по матери.'],
 ['这是我外婆。','Zhè shì wǒ wàipó.','Это моя бабушка по матери.']
]);`);
change(app, "['НОВЫЕ СЛОВА','Мама, папа, братья и сёстры','Первые четыре слова о семье'],", "['НОВЫЕ СЛОВА','Родители, бабушки и дедушки','Семья по отцовской и материнской линии'],");
change(app, "['НОВЫЕ СЛОВА','Сёстры, дом и семья','Продолжаем знакомиться с родственниками'],", "['НОВЫЕ СЛОВА','Братья, сёстры и семья','Старшие, младшие и слово 家'],");
change(app, 'const newlyRecorded=window.PandaLesson6XiaoxiaoV274?.lookup(hz);', 'const newlyRecorded=window.PandaLesson6GrandparentsV275?.lookup(hz)||window.PandaLesson6XiaoxiaoV274?.lookup(hz);');
change(app, "const lesson6New=isFamily&&role!=='male'&&!!window.PandaLesson6XiaoxiaoV274?.lookup(hz);", "const lesson6New=isFamily&&role!=='male'&&!!(window.PandaLesson6GrandparentsV275?.lookup(hz)||window.PandaLesson6XiaoxiaoV274?.lookup(hz));");
change(app, 'function vocab(slice,optional=false){', `function grandparentCards(){
 return '<h2 class="pg6-grandparents-heading">Бабушки и дедушки</h2>'+
 '<div class="pg6-grandparents-grid">'+grandparents.map(([hz,py,ru,emoji])=>
 '<div class="pg6-grandparent-card" data-grandparent="'+esc(hz)+'">'+
 '<div class="pg6-grandparent-icon" aria-hidden="true">'+emoji+'</div>'+
 '<strong lang="zh-Hans">'+hz+'</strong><span class="py">'+py+'</span>'+
 '<span class="ru">'+ru+'</span>'+playBtn(hz)+'</div>').join('')+'</div>';
}
function familyParentsAndGrandparents(){
 return card('<h2>Мама и папа</h2><div class="grid two">'+words.slice(0,2).map(word).join('')+
 '</div>'+grandparentCards())+
 '<p class="small center">По-китайски родственников по маминой и папиной линии называют разными словами.</p>';
}
function vocab(slice,optional=false){`);
const oldExamples = ` return card('<h2>Слушай короткие фразы</h2>'+a.map(([zh,py,ru])=>
  '<div class="example"><strong lang="zh-Hans">'+esc(zh)+'</strong><span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span><div class="buttons">'+playBtn(zh)+'</div></div>').join(''));
}`;
const newExamples = ` return card('<h2>Слушай короткие фразы</h2>'+a.map(([zh,py,ru])=>
  '<div class="example"><strong lang="zh-Hans">'+esc(zh)+'</strong><span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span><div class="buttons">'+playBtn(zh)+'</div></div>').join('')+
  (isFamily?'<h2 class="pg6-grandparents-heading">Представляем бабушек и дедушек</h2>'+
  '<div class="pg6-grandparent-examples">'+grandparentExamples.map(([zh,py,ru])=>
  '<div class="pg6-grandparent-phrase"><div><strong lang="zh-Hans">'+esc(zh)+'</strong>'+
  '<span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span></div>'+playBtn(zh)+'</div>').join('')+'</div>':''));
}`;
change(app,oldExamples,newExamples);
const oldReview = ` card('<h2>Повторение</h2><div class="grid two">'+(isFamily?words.slice(0,4):[words[0],words[1],words[5],words[6]]).map(word).join('')+'</div>')+`;
const newReview = ` card('<h2>Повторение</h2><div class="grid two">'+(isFamily?words.slice(0,4):[words[0],words[1],words[5],words[6]]).map(word).join('')+
 '</div>'+(isFamily?'<h2 class="pg6-grandparents-heading">Бабушки и дедушки</h2>'+
 '<div class="pg6-grandparent-review">'+grandparents.map(([zh,py,ru])=>
 '<div><b lang="zh-Hans">'+zh+'</b><small>'+py+' · '+ru+'</small>'+playBtn(zh)+'</div>').join('')+'</div>':''))+`;
change(app,oldReview,newReview);
change(app,
 ` ()=>vocab([0,4]),\n ()=>vocab([4,8]),\n ()=>vocab([8,12],!isFamily),`,
 ` ()=>isFamily?familyParentsAndGrandparents():vocab([0,4]),\n ()=>isFamily?vocab([2,7]):vocab([4,8]),\n ()=>isFamily?vocab([7,11]):vocab([8,12],!isFamily),`);
const cssFile = 'assets/panda-go-approved-lessons-v231.css';
const css = fs.readFileSync(cssFile, 'utf8');
const addCSS = `
/* Panda Go family v275: four new grandparents; scoped to lesson 6 only. */
.app[data-lesson="6"] .pg6-grandparents-heading{font-size:17px;line-height:1.3;margin:16px 2px 10px;text-align:center;color:#713991}
.app[data-lesson="6"] .pg6-grandparents-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.app[data-lesson="6"] .pg6-grandparent-card{min-width:0;border:1px solid #e7c6ec;border-radius:18px;padding:10px 6px 12px;background:linear-gradient(160deg,#fffaf8,#fbeafa);display:flex;align-items:center;flex-direction:column;gap:4px;box-shadow:0 3px 8px #bba0c321}
.app[data-lesson="6"] .pg6-grandparent-icon{font-size:44px;line-height:1.15;width:72px;height:66px;display:grid;place-items:center;background:#ffecf1;border-radius:18px}
.app[data-lesson="6"] .pg6-grandparent-card:nth-child(3) .pg6-grandparent-icon,.app[data-lesson="6"] .pg6-grandparent-card:nth-child(4) .pg6-grandparent-icon{background:#ebe8fc}
.app[data-lesson="6"] .pg6-grandparent-card strong{font-family:LessonHanzi,'Noto Sans SC',sans-serif;font-size:29px;color:#693996}
.app[data-lesson="6"] .pg6-grandparent-card .py{font-size:13px;font-weight:750;color:#7b5193}
.app[data-lesson="6"] .pg6-grandparent-card .ru{font-size:12px;color:#70577e;text-align:center;min-height:30px;line-height:1.25}
.app[data-lesson="6"] .pg6-grandparent-card .audio{margin-top:4px}
.app[data-lesson="6"] .pg6-grandparent-examples{display:grid;gap:9px}
.app[data-lesson="6"] .pg6-grandparent-phrase{display:grid;grid-template-columns:minmax(0,1fr) 43px;align-items:center;gap:8px;padding:11px;border:1px solid #e9d5ed;border-radius:17px;background:#fffaff}
.app[data-lesson="6"] .pg6-grandparent-phrase strong{display:block;font-family:LessonHanzi,'Noto Sans SC',sans-serif;font-size:21px;color:#653c90;line-height:1.3}
.app[data-lesson="6"] .pg6-grandparent-phrase .py,.app[data-lesson="6"] .pg6-grandparent-phrase .ru{display:block;font-size:12px;line-height:1.45;color:#745e86}
.app[data-lesson="6"] .pg6-grandparent-review{display:grid;gap:8px}
.app[data-lesson="6"] .pg6-grandparent-review>div{display:grid;grid-template-columns:72px minmax(0,1fr) 42px;align-items:center;gap:6px;border-radius:13px;border:1px solid #e9d5ed;padding:7px;background:#fffaff}
.app[data-lesson="6"] .pg6-grandparent-review b{font-size:23px;font-family:LessonHanzi,'Noto Sans SC',sans-serif;color:#653c90}
.app[data-lesson="6"] .pg6-grandparent-review small{font-size:12px;line-height:1.3}
@media(max-width:365px){.app[data-lesson="6"] .pg6-grandparent-card strong{font-size:26px}.app[data-lesson="6"] .pg6-grandparent-icon{font-size:37px;width:60px;height:59px}.app[data-lesson="6"] .pg6-grandparent-phrase strong{font-size:19px}}
`;
if (!css.includes('family v275: four new grandparents')) fs.writeFileSync(cssFile,css+'\n'+addCSS);
const page='hsk1-family-v231.html';
change(page, '<script src="./assets/panda-go-companion-v231.js?v=274"></script>', '<script src="./assets/lesson6-grandparents-v275.js?v=275"></script>\n<script src="./assets/panda-go-companion-v231.js?v=275"></script>');
change(page, './assets/panda-go-approved-lessons-v231.css?v=237', './assets/panda-go-approved-lessons-v231.css?v=275');
change('scripts/verify-panda-go-approved-v231.cjs', "assert(html.includes('panda-go-companion-v231.js?v='+(lesson===7?'249':'274')));", "assert(html.includes('panda-go-companion-v231.js?v='+(lesson===7?'249':'275')));");
const packFile='assets/offline-pack.json';
const pack=JSON.parse(fs.readFileSync(packFile,'utf8'));
pack.version=Math.max(275,Number(pack.version||0));
const paths = ['./assets/lesson6-grandparents-v275.js?v=275','./assets/panda-go-companion-v231.js?v=275','./assets/panda-go-approved-lessons-v231.css?v=275','./hsk1-family-v231.html?v=275',...manifest.clips.map(e=>'./'+folder+'/'+e.file)];
for(const p of paths)if(!pack.files.includes(p))pack.files.push(p);
fs.writeFileSync(packFile,JSON.stringify(pack,null,2)+'\n');
const swFile='sw.js', sw=fs.readFileSync(swFile,'utf8');
fs.writeFileSync(swFile,sw.replace(/^const CACHE='[^']+';/,"const CACHE='chinese-coach-pwa-v275-lesson6-grandparents';"));
console.log('Installed lesson 6 grandparents v275: eight recordings and examples; 14 screens preserved.');