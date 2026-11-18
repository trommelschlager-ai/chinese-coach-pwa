'use strict';
// Technical audio audit for Panda Go. Tests file integrity, NOT word/tonal correctness.
// Usage: node scripts/audit-panda-audio.cjs [--deep]
// --deep requires ffprobe and ffmpeg and decodes every audio asset.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const deep = process.argv.includes('--deep');
const formats = {}, failures = [], warnings = [], sampleFiles = [];
const files = [];
const supported = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.opus', '.flac', '.webm']);
const skipped = new Set(['.git','node_modules','dist','coverage','reports','.vite']);
function scan(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    const target = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (!skipped.has(entry.name)) scan(target);
    } else if (entry.isFile() && supported.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
}
function available(exe) {
  const p=cp.spawnSync(exe,['-version'],{encoding:'utf8',timeout:5000});
  return !p.error && p.status===0;
}
function validHeader(b, ext) {
  const chars = (a, n) => b.subarray(a,a+n).toString('latin1');
  if (ext==='.mp3') {
    if (chars(0,3)==='ID3') return true;
    for (let i=0; i<b.length-1; i++)
      if (b[i]===255 && (b[i+1]&224)===224 && ((b[i+1]>>3)&3)!==1 && ((b[i+1]>>1)&3)!==0) return true;
    return false;
  }
  if (ext==='.wav') return ['RIFF','RF64'].includes(chars(0,4)) && chars(8,4)==='WAVE';
  if (['.ogg','.oga','.opus'].includes(ext)) return chars(0,4)==='OggS';
  if (ext==='.flac') return chars(0,4)==='fLaC';
  if (ext==='.m4a') return chars(4,4)==='ftyp';
  if (ext==='.webm') return b.subarray(0,4).equals(Buffer.from([26,69,223,163]));
  if (ext==='.aac') return b[0]===255 && (b[1]&246)===240;
  return true;
}
const codecsAvailable=!deep||(available('ffprobe')&&available('ffmpeg'));
if (!codecsAvailable) failures.push({file:'(runner)',reason:'--deep requires ffprobe and ffmpeg'});
scan(root);
files.sort();
let bytes=0, durationSec=0, durationCount=0;
for (const file of files) {
  const rel=path.relative(root,file).split(path.sep).join('/');
  const ext=path.extname(file).toLowerCase();
  formats[ext]=(formats[ext]||0)+1;
  const size=fs.statSync(file).size;
  bytes+=size;
  if (size<128) {failures.push({file:rel,reason:'audio too small or empty ('+size+' bytes)'});continue;}
  const fd=fs.openSync(file,'r'), header=Buffer.alloc(Math.min(32768,size));
  try {fs.readSync(fd,header,0,header.length,0);} finally {fs.closeSync(fd);}
  if (!validHeader(header,ext)) {failures.push({file:rel,reason:'unexpected audio header'});continue;}
  if (!deep||!codecsAvailable) continue;
  const probe=cp.spawnSync('ffprobe',['-v','error','-select_streams','a:0',
    '-show_entries','stream=codec_type,codec_name:format=duration','-of','json',file],
    {encoding:'utf8',timeout:15000,maxBuffer:262144});
  if (probe.error||probe.status!==0) {
    failures.push({file:rel,reason:'ffprobe failed',detail:String(probe.stderr||probe.error?.message||'').slice(0,300)});
    continue;
  }
  let data={};try{data=JSON.parse(probe.stdout||'{}');}catch{}
  const stream=data.streams?.[0];
  if (stream?.codec_type!=='audio') {failures.push({file:rel,reason:'no readable audio stream'});continue;}
  const duration=Number(data.format?.duration);
  if (Number.isFinite(duration)&&duration>0) {
    durationSec+=duration;durationCount++;
    if (duration<.08) warnings.push({file:rel,reason:'very short clip '+duration.toFixed(3)+' s'});
  }
  const decoded=cp.spawnSync('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
    '-i',file,'-map','0:a:0','-f','null','-'],
    {encoding:'utf8',timeout:20000,maxBuffer:262144});
  if (decoded.error||decoded.status!==0||(decoded.stderr||'').trim()) {
    failures.push({file:rel,reason:'decode error',detail:String(decoded.stderr||decoded.error?.message||'').slice(0,300)});
  }
  if (sampleFiles.length<12) sampleFiles.push({file:rel,codec:stream.codec_name||null,
    durationSec:Number.isFinite(duration)?+duration.toFixed(2):null});
}
if (!files.length) failures.push({file:'(repo)',reason:'no audio files found'});
const summary={
  mode:deep?'full-decode':'header-scan',generatedAt:new Date().toISOString(),
  filesExamined:files.length,formats,totalBytes:bytes,
  durationSec:+durationSec.toFixed(2),durationKnownFor:durationCount,
  failures,warnings,sampleFiles,
  limitation:'Technical audio integrity ONLY. This cannot verify Mandarin tones, correct spoken word, dubbing quality or usage rights.'
};
const dir=path.join(root,'reports');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'panda-audio-audit.json'),JSON.stringify(summary,null,2)+'\n');
const lines=[
  '# Panda Go audio audit',
  'Mode: '+summary.mode,
  'Files inspected: '+files.length,
  'Technical failures: '+failures.length,
  'Warnings: '+warnings.length,
  'Formats: '+JSON.stringify(formats),
  summary.limitation,
  ...failures.slice(0,25).map(f=>'- FAIL: '+f.file+': '+f.reason)
];
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
if (failures.length) process.exitCode=1;
