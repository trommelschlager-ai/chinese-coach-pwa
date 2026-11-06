#!/usr/bin/env python3
"""Install a licensed human Mandarin pronunciation for 日 (rì, tone 4).

Source is the published, unmodified MP3 by Yue Tan, Shtooka/audio-cmn.
CC BY-SA 3.0 US: attribution and share-alike conditions must be retained.
This script never touches the existing synthetic voice files or microphones.
"""
from __future__ import annotations

import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3'
SOURCE='https://raw.githubusercontent.com/hugolpz/audio-cmn/master/96k/hsk/cmn-%E6%97%A5.mp3'

def main():
    TARGET.parent.mkdir(parents=True,exist_ok=True)
    if not TARGET.exists():
        req=Request(SOURCE,headers={'User-Agent':'PandaGo-HSK1-Voice-Correction/1.0'})
        with urlopen(req,timeout=40) as resp:
            if resp.status!=200:raise RuntimeError('Native reference unavailable')
            audio=resp.read(150000)
        if len(audio)<4000 or len(audio)>=150000:
            raise RuntimeError('Unexpected native audio length')
        if not(audio.startswith(b'ID3') or audio[0]==0xFF):
            raise RuntimeError('Not a recognized MP3')
        TARGET.write_bytes(audio)
    else:
        audio=TARGET.read_bytes()
    if len(audio)<4000:raise RuntimeError('Empty native clip')
    import subprocess
    raw=subprocess.check_output([
        'ffprobe','-v','error','-select_streams','a:0',
        '-show_entries','format=duration:stream=codec_name',
        '-of','json',str(TARGET)
    ],text=True)
    info=json.loads(raw)
    duration=float(info['format']['duration'])
    if not (0.25<duration<4.0) or info['streams'][0]['codec_name']!='mp3':
        raise RuntimeError('Native voice clip has unexpected format or duration')
    print(f'Licensed native 日 (rì) clip present: {len(audio)} bytes, {duration:.2f}s')
    print('Source: Yue Tan / Shtooka, CC BY-SA 3.0 US, via hugolpz/audio-cmn.')

if __name__=='__main__':
    main()
