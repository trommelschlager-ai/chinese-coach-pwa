/* Panda Go HSK1 lesson 2 v261: Xiaoxiao TTS route for 16 unique learner phrases.
 * Preserve male voices in intentional two-speaker dialogues. Native tone QA pending. */
(()=>{'use strict';
const clips=Object.freeze({
"我":"./assets/lesson1-xiaoxiao-v260/wo.mp3",
"你":"./assets/lesson1-xiaoxiao-v260/ni.mp3",
"您":"./assets/panda-lesson2-xiaoxiao-v261/nin.mp3",
"他":"./assets/panda-xiaoxiao-trainer-v250/p041.mp3",
"她":"./assets/panda-xiaoxiao-trainer-v250/p041.mp3",
"它":"./assets/panda-xiaoxiao-trainer-v250/p041.mp3",
"我们":"./assets/panda-lesson2-xiaoxiao-v261/women.mp3",
"你们":"./assets/panda-lesson2-xiaoxiao-v261/nimen.mp3",
"你好":"./assets/lesson1-xiaoxiao-v260/nihao.mp3",
"是":"./assets/lesson1-xiaoxiao-v260/shi.mp3",
"老师":"./assets/panda-lesson2-xiaoxiao-v261/laoshi.mp3",
"学生":"./assets/lesson1-xiaoxiao-v260/xuesheng.mp3",
"吗":"./assets/panda-xiaoxiao-trainer-v250/p079.mp3",
"我是老师":"./assets/panda-lesson2-xiaoxiao-v261/woshilaoshi.mp3",
"你是老师吗":"./assets/panda-lesson2-xiaoxiao-v261/nishilaoshima.mp3",
"是的我是老师":"./assets/panda-lesson2-xiaoxiao-v261/shidewoshilaoshi.mp3"
});
const clean=s=>String(s??'').replace(/[\s。，！？!?,]/g,'');
window.PandaLesson2XiaoxiaoV261=Object.freeze({clips,lookup:s=>clips[clean(s)]||null});
})();
