'use strict';
const fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom'),crypto=require('crypto'),cp=require('child_process');
const pages=[['hsk1-first-v189.html','pg-hsk1-v189-lesson1',15],['hsk1-second-v203.html','pg-hsk1-v203-pronouns',12],['hsk1-third-v212.html','pg-hsk1-v213-numbers',14],['hsk1-fourth-v214.html','pg-hsk1-v215-weekdays',13],['hsk1-fifth-v227.html','pg-hsk1-l5-v227',14],['hsk1-family-v231.html','pg-hsk1-l6-v231',14],['hsk1-weather-v231.html','pg-hsk1-l7-v231',14]];
const result=[],errors=[],metrics=new Map(),rawSources={};
fs.mkdirSync('/tmp/panda-audit',{recursive:true});
function measure(src){
 const id=crypto.createHash('sha256').update(src).digest('hex').slice(0,16);if(metrics.has(id))return metrics.get(id);
 let path=src;if(src.startsWith('data:')){path='/tmp/panda-audit/'+id+'.mp3';fs.writeFileSync(path,Buffer.from(src.split(',')[1],'base64'))}
 else path=src.replace(/^\.\//,'');
 if(!fs.existsSync(path)){const m={exists:false};metrics.set(id,m);return m}
 const probe=cp.spawnSync('ffprobe',['-v','quiet','-show_entries','format=duration','-of','csv=p=0',path],{encoding:'utf8'});
 const run=cp.spawnSync('ffmpeg',['-hide_banner','-i',path,'-af','loudnorm=I=-18:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
 let levels={};try{const m=JSON.parse(run.stderr.slice(run.stderr.lastIndexOf('{'),run.stderr.lastIndexOf('}')+1));levels={lufs:Number(m.input_i),true_peak_dbtp:Number(m.input_tp)}}catch{}
 const m={exists:true,duration:Number(probe.stdout),...levels};metrics.set(id,m);return m;
}
for(let lesson=1;lesson<=7;lesson++){
 const [page,key,total]=pages[lesson-1],html=fs.readFileSync(page,'utf8');
 for(let step=0;step<total;step++){
  const dom=new JSDOM(html,{url:'https://panda.test/'+page,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}),w=dom.window,d=w.document,played=[];
  w.localStorage.setItem(key,JSON.stringify({step,lessonVersion:237,maxStep:total-1,done:lesson===2?Array(total).fill(false):false,viewed:{1:[],2:[]},completedSpeech:{1:[],2:[]},selected:{1:1,2:6}}));
  w.Audio=function(src){this.src=src;played.push(src);this.pause=()=>{};this.play=()=>Promise.resolve();this.load=()=>{}};
  w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
  w.HTMLMediaElement.prototype.canPlayType=()=> 'probably';
  for(const script of [...d.querySelectorAll('script[src]')]){
   const path=script.getAttribute('src').split('?')[0].replace(/^\.\//,'');if(path.includes('/vendor/'))continue;
   try{w.eval(fs.readFileSync(path,'utf8'))}catch(e){errors.push({lesson,step:step+1,path,error:e.message})}
  }
  const rendered=d.querySelector('#pg-counter,#pg3-count,#pg5-count')?.textContent;
  if(parseInt(rendered)!==step+1)errors.push({lesson,step:step+1,error:'Saved screen not restored: '+rendered});
  for(const button of [...d.querySelectorAll('[data-say],[data-audio],[data-play],[data-tone-play],[data-study]')]){
   const text=button.dataset.say||button.dataset.play||button.dataset.tonePlay||button.dataset.audio||button.dataset.study;
   const role=button.dataset.role||'female';played.length=0;
   if(!button.disabled)button.click();
   const src=played[0]||null;if(src)rawSources[crypto.createHash('sha256').update(src).digest('hex')]=src;
   const owner=!!src&&src.startsWith('./assets/owner-clean-v237/');
   const context=button.closest('.word,.example,.bubble,.sheet,.pg3-card,.pg13-num-card')||button.parentElement;
   const py=context?.querySelector('.py,.pinyin,small,span')?.textContent||'';
   const entry={lesson,screen:step+1,phrase:text,role,pinyin_context:py.slice(0,130),source:owner?'approved original speaker':src?.includes('numbers-clean')?'compiled numbers from another speaker':src?'existing fallback; speaker needs review':'no playback captured',path:src?.startsWith('data:')?'embedded:sha256:'+crypto.createHash('sha256').update(src).digest('hex'):src,disabled:button.disabled,...(src?measure(src):{}),noise:'not listening-verified',pronunciation:'not listening-verified'};
   result.push(entry);
  }
  w.close();
 }
}
fs.writeFileSync('/tmp/panda-audio-sources.json',JSON.stringify(rawSources));
fs.writeFileSync('qa/v237/active-audio-registry.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync('qa/v237/screen-audit-errors.json',JSON.stringify(errors,null,2)+'\n');
const missing=[...new Map(result.filter(r=>r.role!=='male'&&r.source!=='approved original speaker').map(r=>[r.lesson+'|'+r.phrase,{lesson:r.lesson,phrase:r.phrase,source:r.source,path:r.path}])).values()];
fs.writeFileSync('qa/v237/needs-native-recording.json',JSON.stringify(missing,null,2)+'\n');
console.log(JSON.stringify({screens:96,audioButtons:result.length,uniqueSources:metrics.size,ownerButtons:result.filter(r=>r.source==='approved original speaker').length,missingNative:missing.length,errors},null,2));
