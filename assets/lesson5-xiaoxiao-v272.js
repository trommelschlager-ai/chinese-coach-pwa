/* Panda Go Lesson 5 v272: new Xiaoxiao recordings and approved repeats from lesson 4. */
(()=>{'use strict';
const clips=Object.freeze({
  "一月": "./assets/lesson5-xiaoxiao-v272/000.mp3",
  "二月": "./assets/lesson5-xiaoxiao-v272/001.mp3",
  "三月": "./assets/lesson5-xiaoxiao-v272/002.mp3",
  "四月": "./assets/lesson5-xiaoxiao-v272/003.mp3",
  "五月": "./assets/lesson5-xiaoxiao-v272/004.mp3",
  "六月": "./assets/lesson5-xiaoxiao-v272/005.mp3",
  "七月": "./assets/lesson5-xiaoxiao-v272/006.mp3",
  "八月": "./assets/lesson5-xiaoxiao-v272/007.mp3",
  "九月": "./assets/lesson5-xiaoxiao-v272/008.mp3",
  "十月": "./assets/lesson5-xiaoxiao-v272/009.mp3",
  "十一月": "./assets/lesson5-xiaoxiao-v272/010.mp3",
  "十二月": "./assets/lesson5-xiaoxiao-v272/011.mp3",
  "年": "./assets/lesson5-xiaoxiao-v272/012.mp3",
  "月": "./assets/lesson5-xiaoxiao-v272/013.mp3",
  "号": "./assets/lesson5-xiaoxiao-v272/014.mp3",
  "二零二六年十一月六日": "./assets/lesson5-xiaoxiao-v272/015.mp3",
  "今天十一月六号。": "./assets/lesson5-xiaoxiao-v272/016.mp3",
  "今天": "./assets/lesson4-xiaoxiao-v265/009.mp3",
  "几": "./assets/lesson4-xiaoxiao-v265/012.mp3",
  "日": "./assets/lesson4-xiaoxiao-v265/013.mp3"
});
const normal=s=>String(s??'').normalize('NFC').trim().replace(/[。！？!?，,\s]+/g,'');
const normalized=Object.freeze(Object.fromEntries(Object.entries(clips).map(([key,file])=>[normal(key),file])));
window.PandaLesson5XiaoxiaoV272=Object.freeze({clips,lookup(text){return clips[text]||normalized[normal(text)]||null}});
})();
