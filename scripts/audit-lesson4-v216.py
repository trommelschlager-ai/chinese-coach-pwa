#!/usr/bin/env python3
"""Deterministic per-file technical audit. Does not certify perceived noise or Mandarin tones."""
import json,re,subprocess,math,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
text=(ROOT/'assets/hsk1-weekdays-audio-map-v214.js').read_text()
items=re.findall(r'"([^"]+)": "([^"]+)"',text)
native=(ROOT/'assets/hsk1-native-human-map-v167.js').read_text()
for word in ['星期','几','日']:
 items.append((word,re.search('"'+word+'": "([^"]+)"',native)[1]))
rows=[]
for word,rel in items:
 path=ROOT/rel.removeprefix('./')
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar','44100','-'],capture_output=True,check=True)
 data=np.frombuffer(decoded.stdout,dtype='<f4');peak=float(abs(data).max());rms=float(np.sqrt(np.mean(data**2)))
 cmd=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 measured=json.JSONDecoder().raw_decode(cmd.stderr[cmd.stderr.rfind('{'):])[0];dur=len(data)/44100
 composed=path.parent.name=='hsk1-weekdays-clean-v214' and int(path.stem) not in [7,8,9,10]
 edge=np.concatenate([data[:2205],data[-2205:]])
 rows.append(dict(word=word,file=rel,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration_seconds=round(dur,3),playback_gain=round(min(1,10**((-18.64-float(measured['input_i']))/20)),4),rms_dbfs=round(20*math.log10(max(rms,1e-9)),2),peak_dbfs=round(20*math.log10(max(peak,1e-9)),2),integrated_lufs=float(measured['input_i']),clipped_samples=int(np.sum(abs(data)>=.999)),edge_50ms_rms_dbfs=round(20*math.log10(max(float(np.sqrt(np.mean(edge**2))),1e-9)),2),decode='passed',provenance='Yue Tan / Shtooka, CC BY-SA 3.0 US',assembly='spliced words' if composed else 'single recorded item',perceptual_noise='not certified by signal statistics',tones='requires native listening review',action='obtain complete natural recording' if composed else 'retain provisionally; native listening review needed'))
report=dict(scope='All 17 lesson-specific clips plus three native-map fallbacks exposed by lesson 4. Every test/repeat reuses these same files. No device TTS.',voice='One credited source speaker; identity continuity inferred from manifest, not speaker-recognition certification.',files=rows,missing=['今天是星期五。','星期天','你星期几有空？','我星期六有空。','我们星期六一起去看电影吧！'],limitations=['Decode and amplitude checks do not prove noise-free or correctly toned Mandarin.','星期二 spelling xīngqī èr is correct; spoken fourth tone still needs native listening sign-off.','Spliced recordings are temporary references, not complete natural phrases.'])
(ROOT/'docs/lesson4-v216/audio-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
lines=['# Урок 4 — проверка аудио v216','','Это техническая проверка каждого используемого файла, а не экспертное прослушивание носительницей. Все файлы декодируются. Тоны и отсутствие воспринимаемого шума не сертифицированы.','','| Текст | Файл | сек | LUFS | Пик dBFS | Клиппинг | Тип / действие |','|---|---|---:|---:|---:|---:|---|']
for r in rows:lines.append(f"| {r['word']} | `{r['file']}` | {r['duration_seconds']} | {r['integrated_lufs']} | {r['peak_dbfs']} | {r['clipped_samples']} | "+('Склейка; получить цельную запись' if r['assembly']=='spliced words' else 'Цельный элемент; требуется прослушивание')+' |')
lines+=['','Громкость при воспроизведении выровнена индивидуальным снижением уровня до около −18.64 LUFS. Файлы и исходный голос не изменены. Шумоподавление по этим измерениям не заявляется.','','Нужны отсутствующие записи: '+', '.join(report['missing'])+'.','','Особо: 星期二 — xīngqī èr; 二 — четвёртый тон. Метка исправна. По статистике MP3 нельзя подтвердить правильность реально произнесённого тона.','','Необходимые цельные замены: '+', '.join(r['word'] for r in rows if r['assembly']=='spliced words')+'.','','Единый источник указан в исходном манифесте. Смена говорящего технически не доказана и не исключена прослушиванием. Разница громкости приведена по файлам; воспринимаемый шум требует слуховой проверки. Системный TTS отключён.']
(ROOT/'docs/lesson4-v216/audio-audit.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'files':len(rows),'decode_failures':0,'clipped_samples':sum(r['clipped_samples'] for r in rows),'lufs_range':[min(r['integrated_lufs'] for r in rows),max(r['integrated_lufs'] for r in rows)],'spliced':sum(r['assembly']=='spliced words' for r in rows),'missing':report['missing']},ensure_ascii=False))
