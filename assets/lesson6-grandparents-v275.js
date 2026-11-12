/* Panda Go v275: eight complete Xiaoxiao recordings for grandparents. */
(()=>{'use strict';
const clips=Object.freeze({
  "爷爷": "./assets/lesson6-grandparents-v275/000.mp3",
  "奶奶": "./assets/lesson6-grandparents-v275/001.mp3",
  "外公": "./assets/lesson6-grandparents-v275/002.mp3",
  "外婆": "./assets/lesson6-grandparents-v275/003.mp3",
  "这是我爷爷。": "./assets/lesson6-grandparents-v275/004.mp3",
  "这是我奶奶。": "./assets/lesson6-grandparents-v275/005.mp3",
  "这是我外公。": "./assets/lesson6-grandparents-v275/006.mp3",
  "这是我外婆。": "./assets/lesson6-grandparents-v275/007.mp3"
});
const norm=s=>String(s??'').normalize('NFC').trim().replace(/[。！？!?，,\s]+/g,'');
const plain=Object.freeze(Object.fromEntries(Object.entries(clips).map(([k,v])=>[norm(k),v])));
window.PandaLesson6GrandparentsV275=Object.freeze({clips,lookup(hz){return clips[hz]||plain[norm(hz)]||null}});
})();
