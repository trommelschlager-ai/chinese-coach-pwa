#!/usr/bin/env node
'use strict';
// Builds ten independent Panda AI audio clips from the owner's single Luvvoice recording.
// No TTS calls and no voice replacements. Exact source sha256 is pinned to prevent mixups.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const dir=path.resolve(__dirname,'../assets/panda-live-voice-v7');
const source=path.join(dir,'source-original.mp3');
const expected='d40ea1646f5bb58a3102a5479669e8a7034030331d756531a30db9ef3f3e609d';
const clips=[
['B01','你学习中文吗？','Nǐ xuéxí Zhōngwén ma?','Ты изучаешь китайский?',0.27,1.66],
['B02','我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский.',2.48,3.73],
['B03','你忙吗？','Nǐ máng ma?','Ты занят?',4.50,5.27],
['B04','我很忙。','Wǒ hěn máng.','Я занят.',6.09,6.87],
['B05','我不忙。','Wǒ bù máng.','Я не занят.',7.67,8.42],
['B06','中文','Zhōngwén','Китайский язык',9.22,9.83],
['B07','学习','xuéxí','Учиться, изучать',10.62,11.36],
['B08','忙','máng','Занятый',12.17,12.49],
['B09','你为什么学习中文？','Nǐ wèishénme xuéxí Zhōngwén?','Почему ты изучаешь китайский?',13.26,14.98],
['B10','因为我喜欢中文。','Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский язык.',15.76,17.67]
];
if(!fs.existsSync(source))throw Error('Missing source-original.mp3');
const digest=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
if(digest!==expected)throw Error('Incorrect source recording: sha256 mismatch');
const manifest=[];
for(const [id,hanzi,pinyin,ru,first,last] of clips){
 const start=Math.max(0,Math.round((first-.14)*1000)/1000);
 const duration=Math.round((last+.18-start)*1000)/1000;
 const endFade=Math.max(0,duration-.055);
 const file=id+'.mp3',dest=path.join(dir,file);
 const args=['-hide_banner','-loglevel','error','-y','-ss',start.toFixed(3),'-i',source,'-t',duration.toFixed(3),
  '-ac','1','-ar','24000','-b:a','96k','-af',`afade=t=in:st=0:d=0.024,afade=t=out:st=${endFade.toFixed(3)}:d=0.055`,dest];
 const p=spawnSync('ffmpeg',args,{encoding:'utf8',timeout:30000});
 if(p.error||p.status!==0)throw Error('ffmpeg '+id+': '+(p.stderr||p.error));
 const length=fs.statSync(dest).size;
 if(length<3000||length>90000)throw Error('Unexpected '+id+' size '+length);
 manifest.push({id,hanzi,pinyin,ru,file,duration_sec:duration,source_start_sec:start,bytes:length,
  sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});
}
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({
 schemaVersion:307,origin:'One owner-supplied Luvvoice source MP3, original pronunciation and voice retained',
  sourceSha256:expected,sampleRate:24000,recordings:manifest,
  note:'Recorded speech, not generative TTS. Check tones and recording rights before commercial release.'
},null,2)+'\n');
console.log('PASS B01–B10: 10 independently playable MP3; original source SHA-256 verified.');
