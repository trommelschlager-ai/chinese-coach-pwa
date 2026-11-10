'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const sources=JSON.parse(fs.readFileSync('/tmp/panda-audio-sources.json')),map={},metrics=[];
fs.mkdirSync('assets/fallback-clean-v237',{recursive:true});
for(const [id,source] of Object.entries(sources)){
 if(source.includes('/owner-clean-v237/')||source.includes('/fallback-clean-v237/'))continue;
 const input=source.startsWith('data:')?'/tmp/panda-audit/'+id.slice(0,16)+'.mp3':source.replace(/^\.\//,'');
 if(!fs.existsSync(input))continue;
 const dest='assets/fallback-clean-v237/'+id.slice(0,16)+'.mp3';
 const run=cp.spawnSync('ffmpeg',['-hide_banner','-y','-i',input,'-af','highpass=f=65,afftdn=nr=5:nf=-45,loudnorm=I=-18:TP=-1.5:LRA=9','-ar','44100','-codec:a','libmp3lame','-b:a','128k',dest],{encoding:'utf8'});
 if(run.status)throw Error(run.stderr);map[source]='./'+dest;
 metrics.push({source:source.startsWith('data:')?'embedded:sha256:'+id:source,path:'./'+dest,provenance:'existing fallback retained; not approved original speaker',pronunciation:'listening review required'});
}
fs.writeFileSync('assets/fallback-audio-v237.js',`/* Level existing fallback sources; never label them as the approved speaker. */\nwindow.PandaAudioLevel=Object.freeze(${JSON.stringify(map,null,2)});\n`);
fs.writeFileSync('qa/v237/fallback-processing.json',JSON.stringify(metrics,null,2)+'\n');console.log('Leveled '+metrics.length+' fallback sources.');
