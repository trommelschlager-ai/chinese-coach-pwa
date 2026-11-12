#!/usr/bin/env bash
set -euo pipefail
source_mp3='assets/hsk1-voices-v160/2a2ee3f1d20f421b6211.mp3'
clean_mp3='assets/lesson5-male-clean-v290.mp3'
test -s "$source_mp3"
command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$source_mp3" \
  -af "highpass=f=85,afftdn=nf=-43,loudnorm=I=-19:TP=-2:LRA=10" \
  -ar 44100 -ac 1 -codec:a libmp3lame -q:a 3 "$clean_mp3"
python3 - <<'PY'
import json,subprocess,pathlib
src=pathlib.Path('assets/hsk1-voices-v160/2a2ee3f1d20f421b6211.mp3')
dst=pathlib.Path('assets/lesson5-male-clean-v290.mp3')
def duration(p):
 r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)],check=True,capture_output=True,text=True)
 return float(r.stdout.strip())
a,b=duration(src),duration(dst)
assert a>.4 and b>.4 and abs(a-b)<.3,(a,b)
assert dst.stat().st_size>3500
def replace(path,old,new):
 p=pathlib.Path(path);s=p.read_text(encoding='utf8')
 if old not in s:
  if new in s:return
  raise ValueError(f'Expected source marker not found: {path}: {old[:70]}')
 p.write_text(s.replace(old,new),encoding='utf8')
replace('assets/hsk1-fifth-v227.js',
 "if(role==='male')return window.PANDA_HSK1_VOICES?.male?.[hz]||null;",
 "if(role==='male')return hz==='今天几月几号？'?'./assets/lesson5-male-clean-v290.mp3':(window.PANDA_HSK1_VOICES?.male?.[hz]||null);")
replace('hsk1-fifth-v227.html','hsk1-fifth-v227.js?v=289','hsk1-fifth-v227.js?v=290')
for file in ['scripts/verify-hsk1-fifth-v227.cjs','scripts/verify-hsk1-lesson5-xiaoxiao-v272.cjs','scripts/verify-panda-native-real-v246.cjs']:
 replace(file,'hsk1-fifth-v227.js?v=289','hsk1-fifth-v227.js?v=290')
replace('scripts/verify-hsk1-lesson5-xiaoxiao-v272.cjs',
 "assert(js.includes(\"if(role==='male')return window.PANDA_HSK1_VOICES?.male?.[hz]||null;\"),'Male role must stay male');",
 "assert(js.includes(\"if(role==='male')return hz==='今天几月几号？'?'./assets/lesson5-male-clean-v290.mp3'\")&&fs.existsSync('assets/lesson5-male-clean-v290.mp3'),'First male question must have cleaned dedicated recording');")
p=pathlib.Path('assets/offline-pack.json')
manifest=json.loads(p.read_text('utf8'))
manifest['version']=max(290,int(manifest.get('version',0)))
for item in ['./assets/lesson5-male-clean-v290.mp3','./assets/hsk1-fifth-v227.js?v=290','./hsk1-fifth-v227.html?v=290']:
 if item not in manifest['files']:manifest['files'].append(item)
p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=pathlib.Path('sw.js');s=p.read_text('utf8')
import re
s=re.sub(r"^const CACHE='[^']+';", "const CACHE='chinese-coach-pwa-v290-clean-date-audio';",s,count=1)
p.write_text(s,encoding='utf8')
print('PASS Lesson 5 male audio: duration %.2f -> %.2f sec; cleaned bytes %s'%(a,b,dst.stat().st_size))
PY
