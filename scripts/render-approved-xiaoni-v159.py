#!/usr/bin/env python3
"""Panda Go HSK 1: produce approved zf_xiaoni female voice clips.

Generate 123 new female lines, preserve the original male voice and licensed native 日.
Creates and verifies a reviewable MP3 pack. Never edits running site files.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/hsk1-voices-v156/manifest.json'
DEST=ROOT/'assets/hsk1-voices-v159'
MODEL='hexgrad/Kokoro-82M'
VOICE='zf_xiaoni'
EXCLUDED={'日'}  # Chinese rì has a separately licensed native-speaker clip.

def lines():
    manifest=json.loads(SOURCE.read_text(encoding='utf-8'))
    all_female=[r for r in manifest['files'] if r['role']=='female']
    selected=[r for r in all_female if r['text'] not in EXCLUDED]
    if len(all_female)!=124 or len(selected)!=123:
        raise RuntimeError(f'Unexpected number of HSK1 female clips: {len(all_female)}, {len(selected)}')
    return selected

def probe(file):
    if not file.exists() or file.stat().st_size<1200:
        raise RuntimeError(f'MP3 missing or too short: {file}')
    raw=subprocess.check_output([
        'ffprobe','-v','error','-select_streams','a:0',
        '-show_entries','format=duration:stream=codec_name,channels',
        '-of','json',str(file)],text=True)
    obj=json.loads(raw)
    stream=obj['streams'][0]
    duration=float(obj['format']['duration'])
    if stream['codec_name']!='mp3' or stream['channels']!=1 or not (.2<duration<24):
        raise RuntimeError(f'Invalid Mandarin MP3: {file.name} {obj}')
    return round(duration,3)

def render(selected):
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        raise SystemExit('ffmpeg/ffprobe required')
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline
    DEST.mkdir(parents=True,exist_ok=True)
    pipeline=KPipeline(lang_code='z',repo_id=MODEL)
    for i,item in enumerate(selected,1):
        output=DEST/item['file']
        if output.exists() and output.stat().st_size>1200:
            probe(output)
            continue
        outputs=[np.asarray(audio,dtype=np.float32) for _,_,audio in
                 pipeline(item['text'],voice=VOICE,speed=1.0)]
        if not outputs:
            raise RuntimeError(f'No audio for {item["text"]}')
        waveform=np.concatenate(outputs)
        if not np.isfinite(waveform).all() or len(waveform)<1800:
            raise RuntimeError(f'Invalid generated waveform for {item["text"]}')
        with tempfile.TemporaryDirectory() as folder:
            wav=pathlib.Path(folder)/'sample.wav'
            sf.write(str(wav),waveform,24000)
            subprocess.run([
                'ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),
                '-ac','1','-ar','24000','-c:a','libmp3lame','-qscale:a','3',str(output)
            ],check=True)
        duration=probe(output)
        print(f'{i:03}/{len(selected)}: {item["text"]} ({duration:.2f}s)',flush=True)

def verify(selected):
    if not shutil.which('ffprobe'):
        raise SystemExit('ffprobe required')
    durations={r['file']:probe(DEST/r['file']) for r in selected}
    if len(durations)!=123:
        raise RuntimeError('Not all 123 files present')
    metadata={
        'status':'USER_APPROVED_VOICE_TIMBRE__PHONETIC_REVIEW_PENDING',
        'model':MODEL,
        'license':'Apache-2.0',
        'speaker':VOICE,
        'speed':1.0,
        'total_files':len(selected),
        'excluded_native_pronunciation':'日 (rì)',
        'human_tone_audit_complete':False,
        'files':[{
            'text':r['text'],'pinyin_reference':r.get('pinyin_reference'),
            'file':r['file'],'duration_seconds':durations[r['file']],
            'review':'requires_native_tone_check'
        } for r in selected]
    }
    DEST.joinpath('manifest.json').write_text(
        json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Verified 123 new zf_xiaoni MP3 files; human phonetic review remains outstanding.')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--render',action='store_true')
    parser.add_argument('--verify',action='store_true')
    args=parser.parse_args()
    if not args.render and not args.verify:
        parser.error('Choose --render or --verify')
    selected=lines()
    if args.render:
        render(selected)
    verify(selected)

if __name__=='__main__':main()
