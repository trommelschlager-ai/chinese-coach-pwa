#!/usr/bin/env bash
set -euo pipefail
original='assets/hsk1-voices-v156/4f021cfad29f631acf58.mp3'
output='assets/lesson7-opening-male-v291.mp3'
test -s "$original"
if ! command -v ffmpeg >/dev/null; then sudo apt-get update -qq; sudo apt-get install -y -qq ffmpeg; fi
if ffmpeg -hide_banner -filters 2>/dev/null | grep -q rubberband; then
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$original" \
    -af 'highpass=f=80,afftdn=nf=-43,rubberband=pitch=0.88:formant=shifted,loudnorm=I=-19:TP=-2:LRA=10' \
    -codec:a libmp3lame -ar 44100 -ac 1 -q:a 3 "$output"
else
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$original" \
    -af 'aresample=44100,highpass=f=80,afftdn=nf=-43,asetrate=38808,aresample=44100,atempo=1.1363636,loudnorm=I=-19:TP=-2:LRA=10' \
    -codec:a libmp3lame -ar 44100 -ac 1 -q:a 3 "$output"
fi
python3 - <<'PY'
from pathlib import Path
import json,subprocess,re
src=Path('assets/hsk1-voices-v156/4f021cfad29f631acf58.mp3')
dst=Path('assets/lesson7-opening-male-v291.mp3')
def duration(p):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)],text=True).strip())
a,b=duration(src),duration(dst)
assert a>0.5 and b>0.5 and abs(a-b)<0.30,(a,b)
assert dst.stat().st_size>5000 and dst.read_bytes().startswith(b'ID3')
def patch(path,old,new):
    f=Path(path);s=f.read_text(encoding='utf8')
    if old not in s:
        if new in s:return
        raise ValueError(f'{path}: missing marker {old[:80]!r}')
    f.write_text(s.replace(old,new),encoding='utf8')
voice=Path('assets/lesson7-opening-male-v291.js')
voice.write_text("""/* A single deeper male recording for A's opening weather question; leave Xiaoxiao as female B. */
(()=>{'use strict';
const map=window.PANDA_HSK1_VOICES;
if(!map||!map.male)return;
map.male['今天天气怎么样？']='./assets/lesson7-opening-male-v291.mp3';
map.male['今天天气怎么样']='./assets/lesson7-opening-male-v291.mp3';
})();
""",encoding='utf8')
patch('hsk1-weather-v231.html','<script src="./assets/panda-go-companion-v231.js?v=289"></script>',
      '<script src="./assets/lesson7-opening-male-v291.js?v=291"></script>\n<script src="./assets/panda-go-companion-v231.js?v=291"></script>')
patch('hsk1-family-v231.html','panda-go-companion-v231.js?v=289','panda-go-companion-v231.js?v=291')
patch('hsk1-fifth-v227.html','hsk1-fifth-v227.js?v=290','hsk1-fifth-v227.js?v=291')
patch('hsk1-second-v203.html','hsk1-second-v203.js?v=289','hsk1-second-v203.js?v=291')
for p in ['scripts/verify-hsk1-fifth-v227.cjs','scripts/verify-hsk1-lesson5-xiaoxiao-v272.cjs','scripts/verify-panda-native-real-v246.cjs']:
    patch(p,'hsk1-fifth-v227.js?v=290','hsk1-fifth-v227.js?v=291')
patch('scripts/verify-hsk1-second-v203.cjs','hsk1-second-v203.js?v=289','hsk1-second-v203.js?v=291')
patch('scripts/verify-panda-go-approved-v231.cjs','panda-go-companion-v231.js?v=289','panda-go-companion-v231.js?v=291')
patch('scripts/verify-lesson6-photos-v276.cjs','panda-go-companion-v231.js?v=289','panda-go-companion-v231.js?v=291')
test=Path('scripts/verify-lesson7-opening-male-v291.cjs')
test.write_text("""'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const f=fs.readFileSync('assets/lesson7-opening-male-v291.mp3');
assert(f.length>5000&&f.subarray(0,3).toString('ascii')==='ID3','Male audio must be an MP3');
const scripts=['assets/hsk1-voices-map-v160.js','assets/lesson7-opening-male-v291.js'];
const ctx={window:{}};vm.createContext(ctx);
for(const p of scripts)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const voices=ctx.window.PANDA_HSK1_VOICES;
assert.equal(voices.male['今天天气怎么样？'],'./assets/lesson7-opening-male-v291.mp3');
assert(voices.female['今天天气怎么样？'].includes('hsk1-voices-v160'),'Do not replace female narrator');
const html=fs.readFileSync('hsk1-weather-v231.html','utf8');
assert(html.includes('lesson7-opening-male-v291.js?v=291'));
assert(html.indexOf('hsk1-voices-map-v160.js')<html.indexOf('lesson7-opening-male-v291.js'));
assert(html.indexOf('lesson7-opening-male-v291.js')<html.indexOf('panda-go-companion-v231.js'));
const code=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
assert(code.includes("playBtn(zh,who==='А'?'male':'female')"),'Dialogue speaker A must use the male voice');
assert(code.includes("if(role==='male')"),'Male source must not fall back to female');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(pack.version>=291&&pack.files.includes('./assets/lesson7-opening-male-v291.mp3'));
console.log('PASS weather dialogue A: dedicated male MP3, voice mapping, script order, offline download and female B preserved');
""",encoding='utf8')
# CI workflow is updated separately by the connected GitHub editor with workflows permission.
p=Path('assets/offline-pack.json')
pack=json.loads(p.read_text('utf8'))
pack['version']=max(int(pack.get('version',0)),291)
for r in ['./assets/lesson7-opening-male-v291.mp3','./assets/lesson7-opening-male-v291.js?v=291','./assets/panda-go-companion-v231.js?v=291','./assets/hsk1-fifth-v227.js?v=291','./assets/hsk1-second-v203.js?v=291','./hsk1-weather-v231.html?v=291','./hsk1-family-v231.html?v=291','./hsk1-fifth-v227.html?v=291','./hsk1-second-v203.html?v=291']:
    if r not in pack['files']:pack['files'].append(r)
p.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=Path('sw.js')
s=p.read_text('utf8')
s=re.sub(r"^const CACHE='[^']+';","const CACHE='chinese-coach-pwa-v291-replay-male-weather';",s,count=1)
p.write_text(s,encoding='utf8')
p=Path('scripts/verify-panda-mobile-repairs-v290.cjs')
s=p.read_text('utf8').replace("hsk1-second-v203.js?v=289","hsk1-second-v203.js?v=291").replace("hsk1-fifth-v227.js?v=290","hsk1-fifth-v227.js?v=291").replace("panda-go-companion-v231.js?v=289","panda-go-companion-v231.js?v=291").replace("v290-clean-date-audio","v291-replay-male-weather")
p.write_text(s,encoding='utf8')
print('PASS new male weather MP3 %.2f -> %.2f sec, bytes %d; course replay scripts updated'%(a,b,dst.stat().st_size))
PY
