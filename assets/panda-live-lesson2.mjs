// Draft conversation 2. No other speaker is substituted for missing audio.
import {PILOT_LINES} from './panda-voice-pilot-engine.mjs?v=live5';
const answers=[
 ['我是老师','teacher'],['是，我是老师','teacher'],['wǒ shì lǎoshī','teacher'],['wo3 shi4 lao3 shi1','teacher'],
 ['不是，我是学生','student'],['我不是老师，我是学生','student'],['我是学生','student'],
 ['wǒ shì xuésheng','student'],['bú shì, wǒ shì xuésheng','student'],['bù shì, wǒ shì xuésheng','student']
];
export const LESSON2=Object.freeze({
 id:2,theme:'Местоимения и представление',requiresLesson:2,status:'pilot-audio-complete-device-test-pending',
 lines:Object.freeze([
  PILOT_LINES[0],
  Object.freeze({panda:'你是老师吗？',pinyin:'Nǐ shì lǎoshī ma?',ru:'Ты учитель?',audioKey:'你是老师吗',
   instruction:'Скажи «Я учитель» или «Нет, я ученик».',
   accepted:Object.freeze(answers.map(([text])=>text)),
   options:Object.freeze(answers.map(([match,branch])=>Object.freeze({match,branch})))})
 ]),
 replies:Object.freeze({
  teacher:Object.freeze({hanzi:'我也是老师。',pinyin:'Wǒ yě shì lǎoshī.',ru:'Я тоже учитель.',audioKey:'我也是老师'}),
  student:Object.freeze({hanzi:'我是老师。',pinyin:'Wǒ shì lǎoshī.',ru:'Я учитель.',audioKey:'我是老师'})
 }),
 newWords:Object.freeze([]),
 vocabulary:Object.freeze([
  {hanzi:'老师',pinyin:'lǎoshī',ru:'учитель'},
  {hanzi:'学生',pinyin:'xuésheng',ru:'ученик / студент'},
  {hanzi:'是',pinyin:'shì',ru:'быть / являться'},
  {hanzi:'不是',pinyin:'bú shì',ru:'не являться; 不 перед четвёртым тоном звучит bú'},
  {hanzi:'也',pinyin:'yě',ru:'тоже; уже встречалось в первом разговоре'}
 ]),
 examples:Object.freeze([
  {hanzi:'我是老师。',pinyin:'Wǒ shì lǎoshī.',ru:'Я учитель.'},
  {hanzi:'不是，我是学生。',pinyin:'Bú shì, wǒ shì xuésheng.',ru:'Нет, я ученик.'}
 ])
});
