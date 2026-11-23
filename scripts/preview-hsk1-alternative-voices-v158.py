#!/usr/bin/env python3
"""Render 2 alternative Kokoro Chinese female timbres plus independent MeloTTS-ZH.

Samples stay in gitignored .voice-staging for listening; never replace production
without a separate native-Mandarin pronunciation review and user approval.
"""
from __future__ import annotations
import argparse
import json
import pathlib
import shutil
import subprocess
import tempfile

BASE=pathlib.Path(__file__).resolve().parents[1]
OUT=BASE/'.voice-staging/hsk1-alternatives-v158'
PHRASES=[
 ('01_nihao','你好！','Nǐ hǎo!','привет'),
 ('02_hanzi','汉字','hànzì','китайские иероглифы'),
 ('03_pinyin','拼音','pīnyīn','пиньинь'),
 ('04_shengdiao','声调','shēngdiào','тон'),
 ('05_ri','日','rì','день'),
 ('06_ri_sentence','今天是星期日。','Jīntiān shì xīngqīrì.','Сегодня воскресенье'),
 ('07_teacher','我是老师。','Wǒ shì lǎoshī.','Я учитель'),
]
VOICES=['zf_xiaoyi','zf_xiaoni']
def encode(wav,mp3):
 if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
  raise SystemExit('ffmpeg/ffprobe are required')
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),
                 '-ac','1','-ar','24000','-c:a','libmp3lame','-q:a','3',str(mp3)],check=True)
 obj=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0',
       '-show_entries','format=duration:stream=codec_name','-of','json',str(mp3)],text=True))
 duration=float(obj['format']['duration'])
 assert .25<duration<20,(mp3,duration)
 assert obj['streams'][0]['codec_name']=='mp3'
 return round(duration,2)

def plan(engine,voice):
 return {'engine':engine,'voice':voice,'status':'SAMPLE_ONLY_NOT_APPROVED_FOR_COURSE',
         'file_format':'mono MP3 24 kHz','phrases':[],'warning':'All tones must be checked by ear; this is not validated teaching audio.'}

def render_kokoro():
 import numpy as np
 import soundfile as sf
 from kokoro import KPipeline
 pipeline=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M')
 for voice in VOICES:
  dest=OUT/voice;dest.mkdir(parents=True,exist_ok=True);record=plan('Kokoro-82M Apache-2.0',voice)
  for name,hanzi,pinyin,ru in PHRASES:
   filename=name+'.mp3'
   with tempfile.TemporaryDirectory() as td:
    wav=pathlib.Path(td)/'out.wav'
    waves=[np.asarray(s,dtype=np.float32) for _,_,s in pipeline(hanzi,voice=voice,speed=1.0)]
    if not waves:raise RuntimeError(f'No speech for {voice}:{hanzi}')
    sf.write(str(wav),np.concatenate(waves),24000)
    duration=encode(wav,dest/filename)
   record['phrases'].append({'text':hanzi,'pinyin':pinyin,'ru':ru,'file':filename,'duration':duration})
   print(voice,hanzi,duration,flush=True)
  (dest/'manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')

def render_melo():
 from melo.api import TTS
 dest=OUT/'melotts_zh';dest.mkdir(parents=True,exist_ok=True)
 model=TTS(language='ZH',device='cpu')
 sid=model.hps.data.spk2id['ZH']
 record=plan('MeloTTS Chinese MIT', 'ZH')
 for name,hanzi,pinyin,ru in PHRASES:
  filename=name+'.mp3'
  with tempfile.TemporaryDirectory() as td:
   wav=pathlib.Path(td)/'raw.wav'
   model.tts_to_file(hanzi,sid,str(wav),speed=1.0)
   duration=encode(wav,dest/filename)
  record['phrases'].append({'text':hanzi,'pinyin':pinyin,'ru':ru,'file':filename,'duration':duration})
  print('MeloTTS',hanzi,duration,flush=True)
 (dest/'manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('engine',choices=['kokoro','melo'])
 args=p.parse_args()
 if args.engine=='kokoro':render_kokoro()
 else:render_melo()
