'use strict';
// Extract authorized originals without modifying their source packages.
const fs=require('fs'),vm=require('vm'),cp=require('child_process'),crypto=require('crypto');
const w={PANDA_HSK1_VOICES:{female:{}},courseHumanAudio:{},courseNaturalAudio:{}};
for(const f of ['hsk1-native-clean-v198.js','panda-owner-l4-native-v221.js','panda-owner-lessons5-7-native-v221.js'])vm.runInNewContext(fs.readFileSync('assets/'+f,'utf8'),{window:w});
const maps={...w.PANDA_HSK1_VOICES.female,...w.PANDA_HSK1_L4_VOICE_V214};
Object.assign(maps,{'我':'./assets/native-owner-v200/wo.ogg','是':'./assets/native-owner-v200/shi.ogg','天气':'./assets/native-owner-v200/tianqi.ogg'});
fs.mkdirSync('assets/owner-clean-v237',{recursive:true});fs.mkdirSync('/tmp/panda-audio-v237',{recursive:true});
const resolved={},rows=[],done=new Map();
for(const [text,source] of Object.entries(maps)){
 const bytes=source.startsWith('data:')?Buffer.from(source.split(',')[1],'base64'):fs.readFileSync(source);
 const id=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),dest='assets/owner-clean-v237/'+id+'.mp3';
 if(!done.has(id)){
  const input='/tmp/panda-audio-v237/'+id;fs.writeFileSync(input,bytes);
  // Conservative denoising; preserve all speech and pauses, no speed/pitch changes.
  const p=cp.spawnSync('ffmpeg',['-hide_banner','-y','-i',input,'-af','highpass=f=65,afftdn=nr=5:nf=-45,loudnorm=I=-18:TP=-1.5:LRA=9','-ar','44100','-codec:a','libmp3lame','-b:a','128k',dest],{encoding:'utf8'});if(p.status)throw Error(p.stderr);
  const metric=cp.spawnSync('ffmpeg',['-hide_banner','-i',dest,'-af','loudnorm=I=-18:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
  const m=JSON.parse(metric.stderr.slice(metric.stderr.lastIndexOf('{'),metric.stderr.lastIndexOf('}')+1));
  const duration=Number(cp.execFileSync('ffprobe',['-v','quiet','-show_entries','format=duration','-of','csv=p=0',dest],{encoding:'utf8'}));
  done.set(id,{path:'./'+dest,duration,integrated_lufs:Number(m.input_i),true_peak_dbtp:Number(m.input_tp)});
 }
 resolved[text]=done.get(id).path; rows.push({phrase:text,source:source.startsWith('data:')?'authorized original embedded in v198/v221':source,source_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...done.get(id),noise:'light denoising applied; listening review pending',pronunciation:'not yet listening-verified'});
}
fs.writeFileSync('qa/v237/owner-processing.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync('assets/owner-audio-v237.js',`/* Authorized original speaker. Original packages remain unchanged. */\n(()=>{'use strict';\nconst clips=Object.freeze(${JSON.stringify(resolved,null,2)});\nconst key=s=>String(s).replace(/[。！?!？，,\\s]/g,'');\nconst lookup=text=>clips[text]||clips[key(text)]||null;\nwindow.PandaOwnerAudio=Object.freeze({clips,lookup});\n})();\n`);
console.log('Processed '+done.size+' distinct original clips; '+rows.length+' phrase routes. Pronunciation remains unverified.');
