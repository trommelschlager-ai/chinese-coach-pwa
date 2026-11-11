/* Panda Go Lesson 4: 25 complete, individually recorded Xiaoxiao phrases (v265). */
(()=>{'use strict';
const clips=Object.freeze({
  "星期": "./assets/lesson4-xiaoxiao-v265/000.mp3",
  "星期一": "./assets/lesson4-xiaoxiao-v265/001.mp3",
  "星期二": "./assets/lesson4-xiaoxiao-v265/002.mp3",
  "星期三": "./assets/lesson4-xiaoxiao-v265/003.mp3",
  "星期四": "./assets/lesson4-xiaoxiao-v265/004.mp3",
  "星期五": "./assets/lesson4-xiaoxiao-v265/005.mp3",
  "星期六": "./assets/lesson4-xiaoxiao-v265/006.mp3",
  "星期天": "./assets/lesson4-xiaoxiao-v265/007.mp3",
  "星期日": "./assets/lesson4-xiaoxiao-v265/008.mp3",
  "今天": "./assets/lesson4-xiaoxiao-v265/009.mp3",
  "明天": "./assets/lesson4-xiaoxiao-v265/010.mp3",
  "昨天": "./assets/lesson4-xiaoxiao-v265/011.mp3",
  "几": "./assets/lesson4-xiaoxiao-v265/012.mp3",
  "日": "./assets/lesson4-xiaoxiao-v265/013.mp3",
  "今天星期几？": "./assets/lesson4-xiaoxiao-v265/014.mp3",
  "明天星期几？": "./assets/lesson4-xiaoxiao-v265/015.mp3",
  "今天星期五。": "./assets/lesson4-xiaoxiao-v265/016.mp3",
  "明天星期六。": "./assets/lesson4-xiaoxiao-v265/017.mp3",
  "昨天星期二。": "./assets/lesson4-xiaoxiao-v265/018.mp3",
  "今天星期三。": "./assets/lesson4-xiaoxiao-v265/019.mp3",
  "今天星期一。": "./assets/lesson4-xiaoxiao-v265/020.mp3",
  "今天是星期五。": "./assets/lesson4-xiaoxiao-v265/021.mp3",
  "你星期几有空？": "./assets/lesson4-xiaoxiao-v265/022.mp3",
  "我星期六有空。": "./assets/lesson4-xiaoxiao-v265/023.mp3",
  "我们星期六一起去看电影吧！": "./assets/lesson4-xiaoxiao-v265/024.mp3"
});
const simplify=text=>String(text??'').normalize('NFC').trim().replace(/[。！？!?，,\s]+/g,'');
const normalized=Object.freeze(Object.fromEntries(Object.entries(clips).map(([key,file])=>[simplify(key),file])));
window.PandaLesson4XiaoxiaoV265=Object.freeze({clips,lookup(text){return clips[text]||normalized[simplify(text)]||null}});
})();
