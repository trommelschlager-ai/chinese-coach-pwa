#!/usr/bin/env python3
"""Validate staged Kokoro Mandarin MP3 and create a reviewable, role-specific bundle.

Runs *after* hsk1_kokoro_audio_v155.py --render-all.
Copies generated assets into a feature PR branch. A user-approved voice style does
NOT imply every generated Chinese tone has been phonetic-reviewed.
"""
from __future__ import annotations
import json, pathlib, shutil, subprocess, hashlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'.voice-staging/hsk1-kokoro-v155'
DEST=ROOT/'assets/hsk1-voices-v156'
MAP=ROOT/'assets/hsk1-voices-map-v156.js'
META=DEST/'manifest.json'

def ffprobe(path):
    raw=subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,sample_rate,channels:format=duration',
        '-of','json',str(path)],text=True)
    info=json.loads(raw)
    streams=info.get('streams',[])
    if len(streams)!=1 or streams[0].get('codec_name')!='mp3':
        raise RuntimeError(f'Not a mono MP3 audio file: {path.name}')
    duration=float(info['format']['duration'])
    if not 0.15<duration<25:
        raise RuntimeError(f'Unexpected duration {duration}s {path.name}')
    if int(streams[0].get('channels',0))!=1:
        raise RuntimeError(f'Not mono: {path.name}')
    return duration

def main():
    plan=json.loads((SRC/'review-manifest.json').read_text(encoding='utf-8'))
    assert plan['status']=='CANDIDATES_ONLY_NOT_APPROVED_FOR_RELEASE'
    assert plan['model_license']=='Apache-2.0'
    assert plan['voices']=={'female':'zf_xiaoxiao','male':'zm_yunjian'}
    rows=plan['sentences']
    if len(rows)<125 or len(rows)>300: raise RuntimeError(f'Unexpected scope: {len(rows)}')
    seen=set();audio_map={'female':{},'male':{}}
    DEST.mkdir(parents=True,exist_ok=True)
    by_role={'female':0,'male':0};durations=[]
    for row in rows:
        text=row['text'];role=row['role'];file=row['filename']
        if (role,text) in seen: raise RuntimeError('Duplicate text and speaker')
        seen.add((role,text))
        if not file.endswith('.mp3') or '/' in file or '\\' in file: raise RuntimeError('Unsafe filename')
        src=SRC/file
        if not src.is_file() or src.stat().st_size<1200:raise FileNotFoundError(src)
        duration=ffprobe(src)
        durations.append(duration)
        by_role[role]+=1
        dst=DEST/file
        shutil.copy2(src,dst)
        audio_map[role][text]='./assets/hsk1-voices-v156/'+file
    if by_role['female']<100 or by_role['male']<10:raise RuntimeError(f'Unexpected roles: {by_role}')
    # Use exact strings: male/female share some Chinese phrases; never reuse by pronunciation alone.
    MAP.write_text('/* Kokoro HSK 1 v156. Female narration, A male/B female dialogue; all candidate tones require review. */\n'
       +'window.PANDA_HSK1_VOICES='+json.dumps(audio_map,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    manifest={
        'status':'PROVISIONAL_ARTIFACTS_PENDING_PHONETIC_TONE_REVIEW',
        'format':'mp3 mono 24000 Hz; exact Mandarin transcript mapping',
        'source_model':plan['model'],
        'model_license':'Apache-2.0',
        'voices':plan['voices'],
        'voice_timbres_approved_from_six_samples':True,
        'all_utterance_tones_native_reviewed':False,
        'automatic_speech_accuracy_claimed':False,
        'created_from': 'HSK 1 seven-topic official Panda Go curriculum',
        'total_files':len(rows),
        'role_counts':by_role,
        'durations_seconds_range':[round(min(durations),2),round(max(durations),2)],
        'files':[{
            'role':r['role'],'voice':r['voice'],'text':r['text'],'file':r['filename'],
            'sources':r['origins'],
            'pinyin_reference':r.get('pinyin_reference'),
            'review_status':'pending_native_tone_check'
        } for r in rows]
    }
    META.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"HSK1 voice assets staged for code review: {len(rows)} clips; {by_role}; durations {manifest['durations_seconds_range']}")
    print('Files are added to an unmerged PR; phonetic review is required before live use.')

if __name__=='__main__':main()
