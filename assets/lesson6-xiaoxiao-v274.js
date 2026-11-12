/* Panda Go lesson 6 v274: Xiaoxiao user-provided clips and existing four tonal samples. */
(()=>{'use strict';
const clips=Object.freeze({
  "妈妈": "./assets/lesson6-xiaoxiao-v274/000.mp3",
  "爸爸": "./assets/lesson6-xiaoxiao-v274/001.mp3",
  "哥哥": "./assets/lesson6-xiaoxiao-v274/002.mp3",
  "姐姐": "./assets/lesson6-xiaoxiao-v274/003.mp3",
  "弟弟": "./assets/lesson6-xiaoxiao-v274/004.mp3",
  "妹妹": "./assets/lesson6-xiaoxiao-v274/005.mp3",
  "家": "./assets/lesson6-xiaoxiao-v274/006.mp3",
  "我的": "./assets/lesson6-xiaoxiao-v274/007.mp3",
  "有": "./assets/lesson6-xiaoxiao-v274/008.mp3",
  "没有": "./assets/lesson6-xiaoxiao-v274/009.mp3",
  "一个": "./assets/lesson6-xiaoxiao-v274/010.mp3",
  "我有一个妹妹。": "./assets/lesson6-xiaoxiao-v274/011.mp3",
  "我的妈妈。": "./assets/lesson6-xiaoxiao-v274/012.mp3",
  "我没有哥哥。": "./assets/lesson6-xiaoxiao-v274/013.mp3",
  "这是我爸爸。": "./assets/lesson6-xiaoxiao-v274/014.mp3",
  "是，这是我妈妈。": "./assets/lesson6-xiaoxiao-v274/015.mp3",
  "有，我有一个妹妹。": "./assets/lesson6-xiaoxiao-v274/016.mp3",
  "妈": "./assets/lesson1-xiaoxiao-v260/ma1.mp3",
  "麻": "./assets/lesson1-xiaoxiao-v260/ma2.mp3",
  "马": "./assets/lesson1-xiaoxiao-v260/ma3.mp3",
  "骂": "./assets/lesson1-xiaoxiao-v260/ma4.mp3"
});
const norm=s=>String(s??'').normalize('NFC').trim().replace(/[。！？!?，,\s]+/g,'');
const normalized=Object.freeze(Object.fromEntries(Object.entries(clips).map(([key,value])=>[norm(key),value])));
window.PandaLesson6XiaoxiaoV274=Object.freeze({clips,lookup(x){return clips[x]||normalized[norm(x)]||null}});
})();
