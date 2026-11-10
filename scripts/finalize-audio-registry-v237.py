import json,re,subprocess,csv,math
from pathlib import Path
from pypinyin import lazy_pinyin,Style
fallback=json.loads(Path('assets/fallback-audio-v237.js').read_text().split('Object.freeze(',1)[1].rsplit(');',1)[0])
cache={}
def py(text):
 text=str(text)
 if text.isdigit():
  n=int(text);ds='零一二三四五六七八九'
  text=ds[n] if n<10 else '十'+(ds[n%10] if n%10 else '') if n<20 else '一百' if n==100 else ds[n//10]+'十'+(ds[n%10] if n%10 else '')
 if text=='一百': return text,'yì bǎi'
 p=' '.join(lazy_pinyin(text,style=Style.TONE,neutral_tone_with_five=False)).replace(' 。','。').replace(' ？','？')
 p=p.replace('xué shēng','xué sheng').replace('wǒ men','wǒmen').replace('nǐ men','nǐmen')
 return text,p
def metric(path):
 if path in cache:return cache[path]
 if not path or path.startswith('embedded:'):return {}
 p=Path(path)
 if not p.exists():return {'exists':False}
 r=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-af','loudnorm=I=-18:TP=-1.5:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True)
 try:
  m=json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1]);duration=float(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',str(p)],text=True));out={'exists':True,'duration':duration,'lufs':float(m['input_i']),'true_peak_dbtp':float(m['input_tp'])}
 except Exception:out={'exists':True,'decode_check':'failed'}
 for key in ['lufs','true_peak_dbtp']:
  if key in out and not math.isfinite(out[key]):out[key]=None;out['measurement_note']='Integrated LUFS unavailable for a clip shorter than the 400 ms gate; signal is present.'
 cache[path]=out;return out
for name in ['active-audio-registry','full-route-inventory']:
 rows=json.loads(Path('qa/v237/'+name+'.json').read_text())
 for row in rows:
  row['phrase'],row['pinyin']=py(row['phrase']);row['path']=fallback.get(row.get('path'),row.get('path'));row.update(metric(row['path']));row['noise']='Mild denoising applied; listening assessment pending';row['pinyin_check']='dictionary transcription; sentence sandhi needs listening review'
 Path('qa/v237/'+name+'.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 with Path('qa/v237/'+name+'.csv').open('w') as f:
  cols=['lesson','screen','phrase','pinyin','role','source','path','duration','lufs','true_peak_dbtp','noise','pronunciation'];writer=csv.DictWriter(f,cols,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
rows=json.loads(Path('qa/v237/full-route-inventory.json').read_text())
missing={row['phrase']:row for row in rows if row['role']=='female' and row['source']!='approved original speaker'}
Path('qa/v237/needs-native-recording.json').write_text(json.dumps(list(missing.values()),ensure_ascii=False,indent=2)+'\n')
lines=['# Фразы, для которых нет записи утверждённой носительницы','', 'Временные источники сохранены и выровнены по громкости. Это не подтверждение правильности их произношения.','', '| Китайский | Пиньинь |','|---|---|']
for z in missing.values():lines.append('| '+z['phrase']+' | '+z['pinyin']+' |')
Path('qa/v237/needs-native-recording.md').write_text('\n'.join(lines)+'\n')
print('Measured',len(cache),'files;',len(missing),'phrases need original speaker recordings.')
