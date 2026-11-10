/* Panda Go v246 — recover the authorized speaker's ALREADY RECORDED phrases.
 * Capture originals v183/v184 before later voice libraries override the same keys.
 * This does not synthesize, clone or modify the woman's voice.
 * Recording/script alignment is based on the original 36 + 11 manifests.
 */
(()=>{
 'use strict';
 const map=window.PANDA_HSK1_VOICES?.female||{};
 const words=[
 // woman's 36-word source recording; confirmed Chinese labels in manifest.csv
 '一','一个','一月','一百','七','七月','三','三十五','三月','下雨','不是','我是学生',
 '五月','人','今天','今天下雨','今天几月几号','今天十一月六号','今天天气怎么样','今天很冷',
 '今天星期五','今天是星期五','他','他们','他是老师','你','你们','你好','你是学生','你是老师吗',
 '八','八月','六','六月','冬天','冬天很冷',
 // additional 11-word original recording, 9 unique entries in v184
 '下雪','两个人','九','九月','二','二十三','二月','二零二六年十一月六日','五'
 ];
 const unique={};
 for(const zh of words){
  const file=map[zh];
  if(typeof file==='string'&&file.startsWith('data:audio/mpeg;base64,'))unique[zh]=file;
 }
 const key=s=>String(s).replace(/[。！!?？，,\s]/g,'');
 function lookup(phrase){return unique[phrase]||unique[key(phrase)]||null}
 window.PandaNativeRecoveredV246=Object.freeze({
  clips:Object.freeze(unique),lookup,expected:words.length,available:Object.keys(unique).length
 });
})();
