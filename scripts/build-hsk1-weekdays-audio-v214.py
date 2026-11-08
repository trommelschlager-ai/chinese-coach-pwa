#!/usr/bin/env python3
"""Create cleaned weekday reference recordings from licensed Yue Tan/Shtooka voice.

Original components remain intact. Chinese weekdays and sample sentences are
spliced from the *same* native speaker; they are NOT naturally recorded utterances.
Never synthesize missing 星期天 from the final syllable of unrelated recordings.
"""
from __future__ import annotations
from pathlib import Path
import json
import math
import subprocess
import tempfile
import wave
from array import array

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'assets/yue-tan-human-v166.json'
OUT = ROOT/'assets/hsk1-weekdays-clean-v214'
MANIFEST = ROOT/'assets/hsk1-weekdays-audio-map-v214.js'
RATE = 44100
PARTS = {
 '星期一':['星期','一'],
 '星期二':['星期','二'],
 '星期三':['星期','三'],
 '星期四':['星期','四'],
 '星期五':['星期','五'],
 '星期六':['星期','六'],
 '星期日':['星期日'],
 '今天':['今天'], '明天':['明天'], '昨天':['昨天'],
 '今天星期几？':['今天','星期','几'],
 '明天星期几？':['明天','星期','几'],
 '今天星期五。':['今天','星期','五'],
 '明天星期六。':['明天','星期','六'],
 '昨天星期二。':['昨天','星期','二'],
 '今天星期三。':['今天','星期','三'],
 '今天星期一。':['今天','星期','一'],
}
def run(*args):
 return subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                       text=True,check=True)
def decode(path):
 with wave.open(str(path),'rb') as f:
  assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(RATE,1,2)
  a=array('h')
  a.frombytes(f.readframes(f.getnframes()))
  return a
def write(path,buffer):
 with wave.open(str(path),'wb') as f:
  f.setframerate(RATE);f.setnchannels(1);f.setsampwidth(2)
  f.writeframes(buffer.tobytes())
def prepare(data,label):
 frame=RATE//100
 rms=[math.sqrt(sum(int(x)*int(x) for x in data[i:i+frame])/len(data[i:i+frame]))/32768
      for i in range(0,len(data),frame)]
 peak=max(rms)
 if peak<.002: raise ValueError('silence: '+label)
 threshold=max(.0025,min(.010,peak*.10))
 active=[i for i,x in enumerate(rms) if x>=threshold]
 start=max(0,active[0]*frame-int(RATE*.065))
 end=min(len(data),(active[-1]+1)*frame+int(RATE*.08))
 buf=data[start:end]
 energy=math.sqrt(sum(int(x)*int(x) for x in buf)/len(buf))/32768
 maxamp=max(abs(x) for x in buf)/32768
 gain=min(2.2,max(.7,.115/max(energy,.0001)),.88/max(maxamp,.001))
 fade=min(int(RATE*.022),len(buf)//14)
 result=array('h')
 for i,v in enumerate(buf):
  envelope=min(1.,(i+1)/max(fade,1),(len(buf)-i)/max(fade,1))
  result.append(int(max(-32000,min(32000,round(v*gain*envelope)))))
 return result
def main():
 source={x['hanzi']:ROOT/x['path'].removeprefix('./')
         for x in json.loads(SOURCE.read_text('utf-8'))['items']}
 needed=set(x for parts in PARTS.values() for x in parts)
 for word in needed:
  if word not in source:raise ValueError('No source '+word)
  if not source[word].exists():raise ValueError('Missing source '+word)
 OUT.mkdir(parents=True,exist_ok=True)
 result={}
 with tempfile.TemporaryDirectory(prefix='panda-weekdays-') as folder:
  tmp=Path(folder)
  cleaned={}
  for word in sorted(needed):
   path=tmp/f'{ord(word[0])}_{len(word)}.wav'
   run('ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
       '-i',str(source[word]),'-vn','-af','highpass=f=75,afftdn=nr=7:nf=-43',
       '-ar',str(RATE),'-ac','1','-c:a','pcm_s16le',str(path))
   cleaned[word]=prepare(decode(path),word)
  gap=array('h',[0])*int(.06*RATE)
  for i,(expression,parts) in enumerate(PARTS.items(),1):
   joined=array('h')
   for j,part in enumerate(parts):
    if j:joined.extend(gap)
    joined.extend(cleaned[part])
   p=tmp/f'{i:03}.wav';write(p,joined)
   out=OUT/f'{i:03}.mp3'
   run('ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
      '-i',str(p),'-codec:a','libmp3lame','-b:a','128k',str(out))
   if out.stat().st_size<3500:raise ValueError('Short output '+expression)
   result[expression]='./assets/hsk1-weekdays-clean-v214/'+out.name
 MANIFEST.write_text(
  '/* Yue Tan / Shtooka weekday reference audio; CC BY-SA 3.0 US.\n'
  ' * Native individual clips cleaned conservatively; multiword audio is edited from fragments.\n'
  ' * 星期天 has no verified voice recording and is intentionally omitted. */\n'+
  'window.PANDA_HSK1_L4_VOICE_V214=Object.freeze('+
  json.dumps(result,ensure_ascii=False,indent=2)+');\n','utf-8')
 print('Created',len(PARTS),'weekday/phrase files, same source speaker.')
 print('Not recorded: 星期天. No artificial voice clone was created.')
if __name__=='__main__':main()
