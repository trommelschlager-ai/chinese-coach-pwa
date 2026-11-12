/* Panda Go lesson 7 · v278 · recordings uploaded and SHA-verified. */
(()=>{'use strict';
const clips=Object.freeze({
  "今天": "./assets/lesson4-xiaoxiao-v265/009.mp3",
  "明天": "./assets/lesson4-xiaoxiao-v265/010.mp3",
  "天气": "./assets/lesson7-xiaoxiao-v277/000.mp3",
  "冷": "./assets/lesson7-xiaoxiao-v277/001.mp3",
  "热": "./assets/lesson7-xiaoxiao-v277/002.mp3",
  "晴": "./assets/lesson7-xiaoxiao-v277/003.mp3",
  "阴": "./assets/lesson7-xiaoxiao-v277/004.mp3",
  "下雨": "./assets/lesson7-xiaoxiao-v277/005.mp3",
  "下雪": "./assets/lesson7-xiaoxiao-v277/006.mp3",
  "风": "./assets/lesson7-xiaoxiao-v277/007.mp3",
  "春天": "./assets/lesson7-xiaoxiao-v277/008.mp3",
  "夏天": "./assets/lesson7-xiaoxiao-v277/009.mp3",
  "秋天": "./assets/lesson7-xiaoxiao-v277/010.mp3",
  "冬天": "./assets/lesson7-xiaoxiao-v277/011.mp3",
  "现在": "./assets/lesson7-xiaoxiao-v277/012.mp3",
  "很": "./assets/lesson7-xiaoxiao-v277/013.mp3",
  "今天很冷。": "./assets/lesson7-xiaoxiao-v277/014.mp3",
  "今天下雨。": "./assets/lesson7-xiaoxiao-v277/015.mp3",
  "今天天气怎么样？": "./assets/lesson7-xiaoxiao-v277/016.mp3",
  "冬天很冷。": "./assets/lesson7-xiaoxiao-v277/017.mp3",
  "明天下雨吗？": "./assets/lesson7-xiaoxiao-v277/018.mp3",
  "明天下雨。": "./assets/lesson7-xiaoxiao-v277/019.mp3",
  "今天很冷": "./assets/lesson7-xiaoxiao-v277/014.mp3",
  "今天下雨": "./assets/lesson7-xiaoxiao-v277/015.mp3",
  "今天天气怎么样": "./assets/lesson7-xiaoxiao-v277/016.mp3",
  "冬天很冷": "./assets/lesson7-xiaoxiao-v277/017.mp3",
  "明天下雨吗": "./assets/lesson7-xiaoxiao-v277/018.mp3",
  "明天下雨": "./assets/lesson7-xiaoxiao-v277/019.mp3"
});
window.PandaLesson7XiaoxiaoV277=Object.freeze({clips,lookup(value){const s=String(value??'').trim();return clips[s]||clips[s.replace(/[。！？!?]+$/g,'')]||null;}});
})();
