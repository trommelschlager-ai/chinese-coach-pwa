#!/usr/bin/env python3
"""Bring existing female scene response to an audible level without changing speaker,
wording, playback duration, pitch or any original course audio files.
Use only for HSK1 lesson-2 micro-scene and independently check the result.
"""
from pathlib import Path
import json, re, subprocess
ROOT=Path(__file__).resolve().parents[1]
FEMALE=ROOT/"assets/hsk1-voices-v160/a9bfe33b3286701febc9.mp3"  # 我是老师。
MALE=ROOT/"assets/hsk1-voices-v156/f9d705a301ff75946c24.mp3"  # 你是老师吗？
OUT=ROOT/"assets/hsk1-scene-v205/female-im-teacher-normalized.mp3"
OUT.parent.mkdir(parents=True,exist_ok=True)

def run(*args):
    return subprocess.run(args,check=True,capture_output=True,text=True)

def seconds(path):
    return float(run("ffprobe","-v","error","-show_entries","format=duration",
                     "-of","default=nokey=1:noprint_wrappers=1",str(path)).stdout.strip())

def loudness(path):
    p=run("ffmpeg","-nostdin","-hide_banner","-i",str(path),
          "-af","loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json",
          "-f","null","-")
    hits=re.findall(r'\{[^{}]*"input_i"[^{}]*\}',p.stderr)
    if not hits: raise RuntimeError("Cannot measure integrated loudness")
    return float(json.loads(hits[-1])["input_i"])

assert FEMALE.is_file() and MALE.is_file(),"Missing original human/production assets"
original=seconds(FEMALE)
female_before=loudness(FEMALE)
male_before=loudness(MALE)
# Aim for a clearly audible but not clipped female answer, close to the male level.
# Target range avoids crushing a quiet synthetic source or excessively loud playback.
target=max(-18.0,min(-14.0,male_before+1.0))
run("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
    "-i",str(FEMALE),"-vn","-map_metadata","-1",
    "-af",f"highpass=f=85,loudnorm=I={target:.1f}:TP=-1.5:LRA=8",
    "-ar","44100","-ac","1","-codec:a","libmp3lame","-b:a","160k",
    str(OUT))
after=seconds(OUT)
female_after=loudness(OUT)
assert abs(after-original)<0.14,(after,original)
assert OUT.stat().st_size>8000,"Voice file unexpectedly empty"
# The target measurement may be somewhat different for a very short sentence,
# so we report the value without pretending this is a perceptual hearing test.
print(json.dumps({
    "female_input_LUFS":round(female_before,2),
    "male_input_LUFS":round(male_before,2),
    "female_output_LUFS":round(female_after,2),
    "requested_target_LUFS":round(target,2),
    "female_duration_before_s":round(original,3),
    "female_duration_after_s":round(after,3),
    "output_bytes":OUT.stat().st_size,
    "unchanged_male_file":str(MALE.relative_to(ROOT))
},ensure_ascii=False,indent=2))
