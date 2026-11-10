#!/usr/bin/env python3
"""Panda Go targeted audio repair v249. Uses EXISTING authorized source MP3 only.
Creates fixed-volume, conservatively denoised clips without voice synthesis or pitch shift.
Run in GitHub Actions where full repository assets are available.
"""
from __future__ import annotations
import base64, json, re, subprocess, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"assets"
OUT=ASSETS/"panda-native-clean-v249"
OUT.mkdir(exist_ok=True)
SRC183=ASSETS/"hsk1-human-voice-v183.js"
text=SRC183.read_text(encoding="utf-8")
matches=re.findall(r"[\"']([^\"']+)[\"']\s*:\s*[\"'](data:audio/mpeg;base64,[A-Za-z0-9+/=]+)[\"']",text)
by_id=dict(matches)
routes=dict(re.findall(r"[\"']([^\"']+)[\"']\s*:\s*[\"']([0-9]{2})[\"']",text))
human=dict(by_id)
human.update({phrase:by_id[clipid] for phrase,clipid in routes.items() if clipid in by_id})
if not routes or not human.get("一"):
    print("Original v183 prefix:",repr(text[:310]),flush=True)
    print("v183 numeric clip IDs:",list(by_id)[:50],flush=True)
    print("v183 sample routes:",list(routes.items())[:65],flush=True)
    raise RuntimeError("Original v183 Chinese label-to-recording routing incomplete")
print("Loaded human original phrases:",list(human)[-55:],flush=True)

# Lesson 3 first number; lesson 4 weekday expressions; lesson 5 summary;
# lesson 7 weather dialogue. No clips are invented or assembled.
CLIPS={
 "一": ("human", "一", "yi"),
 "今天": ("human", "今天", "jintian"),
 "几": ("file", "owner-clean-v237/d87c3d415d819a1a.mp3", "ji"),
 "明天": ("file", "owner-clean-v237/99e99791b480ba37.mp3", "mingtian"),
 "昨天": ("file", "owner-clean-v237/5bee77d820414e05.mp3", "zuotian"),
 "星期": ("file", "owner-clean-v237/5c55908bf6e93067.mp3", "xingqi"),
 "今天星期几": ("file", "owner-clean-v237/31720cb008efefc0.mp3", "jintian_xingqiji"),
 "今天星期五": ("human", "今天星期五", "jintian_xingqiwu"),
 "今天是星期五": ("human", "今天是星期五", "jintianshi_xingqiwu"),
 "今天星期三": ("file", "owner-clean-v237/c55968ade52ad228.mp3", "jintian_xingqisan"),
 "明天星期几": ("file", "owner-clean-v237/13253e0d4858b0c6.mp3", "mingtian_xingqiji"),
 "明天星期六": ("file", "owner-clean-v237/fbb6fd062714219b.mp3", "mingtian_xingqiliu"),
 "年": ("file", "owner-clean-v237/f7a81d33ad2fd572.mp3", "nian"),
 "月": ("file", "owner-clean-v237/cb265750b2a6cf8a.mp3", "yue"),
 "日": ("file", "owner-clean-v237/f7bb63978bb8686d.mp3", "ri"),
 "号": ("file", "owner-clean-v237/494674d90c5cdb0e.mp3", "hao"),
 "明天七号": ("file", "owner-clean-v237/a80d9cb627ef1bf3.mp3", "mingtian_qihao"),
 "今天天气怎么样": ("human", "今天天气怎么样", "jintian_tianqi_zenmeyang"),
 "今天很冷": ("human", "今天很冷", "jintian_henleng"),
 "明天下雨吗": ("file", "owner-clean-v237/784cacd9b93aa9f6.mp3", "mingtian_xiayuma"),
 "明天下雨": ("file", "owner-clean-v237/b21b5596824fcf61.mp3", "mingtian_xiayu"),
}
lookup={}
qa=[]
with tempfile.TemporaryDirectory() as temp:
    td=Path(temp)
    for hz,(typ,source,slug) in CLIPS.items():
        if typ=="human":
            encoded=human.get(source)
            if not encoded or not encoded.startswith("data:audio/mpeg;base64,"):
                raise ValueError("Original woman sample missing "+source)
            src=td/(slug+"_original.mp3")
            src.write_bytes(base64.b64decode(encoded.split(",",1)[1]))
        else:
            src=ASSETS/source
            if not src.is_file():
                raise FileNotFoundError(src)
        dst=OUT/(slug+".mp3")
        probe=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(src)],check=True,capture_output=True,text=True)
        duration=float(probe.stdout.strip())
        if not (0.3<duration<20):
            raise ValueError("Suspicious audio duration "+hz+": "+str(duration))
        # Moderate rather than aggressive denoise to preserve Mandarin consonants and tones.
        effects="highpass=f=85,lowpass=f=7600,afftdn=nr=6:nf=-35,loudnorm=I=-18.5:TP=-2:LRA=8"
        if hz=="一":
            fade=min(.22,duration*.16)
            effects+=f",afade=t=out:st={duration-fade:.3f}:d={fade:.3f}"
        cmd=["ffmpeg","-nostdin","-y","-loglevel","error","-i",str(src),"-af",effects,
             "-ar","44100","-ac","1","-codec:a","libmp3lame","-b:a","96k",str(dst)]
        subprocess.run(cmd,check=True)
        if not dst.exists() or dst.stat().st_size<1500:
            raise ValueError("Bad output MP3 "+hz)
        lookup[hz]="./assets/panda-native-clean-v249/"+slug+".mp3"
        qa.append(dict(hanzi=hz,source=typ,seconds=round(duration,2),bytes=dst.stat().st_size))
# Mark punctuation variants to route to the same full-length original recording.
mapping=dict(lookup)
for hz,filename in lookup.items():
    if len(hz)>1:
        mapping[hz+"。"]=filename
        mapping[hz+"？"]=filename
OUT.joinpath("manifest.json").write_text(json.dumps({"version":249,"clips":qa},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
ASSETS.joinpath("panda-clean-audio-v249.js").write_text(
    "/* Panda Go v249: mastered, denoised, pitch-preserved original Mandarin recordings. */\n"+
    "(()=>{'use strict';const clips=Object.freeze("+json.dumps(mapping,ensure_ascii=False,indent=2)+");\n"+
    "const norm=s=>String(s).replace(/[。！!?？，,\\s]/g,'');\n"+
    "window.PandaCleanAudioV249=Object.freeze({clips,lookup:s=>clips[s]||clips[norm(s)]||null});})();\n",
    encoding="utf-8")
print("CLEANED",len(CLIPS),"original human Mandarin clips (no synthetic audio)")