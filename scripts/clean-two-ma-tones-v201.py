#!/usr/bin/env python3
"""Produce gentle noise-reduced copies of Yue Tan tone 2/3 recordings.

Preserves speaker, pitch, length, pauses, speed, and four-tone contours.
Do not process tone 1 or 4; original clips are left untouched.
"""
from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"assets/course-human"
DEST=ROOT/"assets/course-human-clean-v201"
DEST.mkdir(exist_ok=True)
WORDS=("麻","马")

def command(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()

def duration(path):
    return float(command("ffprobe","-v","error","-show_entries",
        "format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)))

results=[]
for word in WORDS:
    before=SOURCE/f"cmn-{word}.mp3"
    after=DEST/f"cmn-{word}.mp3"
    assert before.is_file(), f"Missing original human recording: {word}"
    input_duration=duration(before)
    assert .3 < input_duration < 7, (word,input_duration)
    # Gentle high-pass and frequency-domain stationary-noise attenuation only.
    # No pitch shift, speed change, time stretching, or voice synthesis.
    subprocess.run([
        "ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
        "-i",str(before),"-vn","-map_metadata","-1",
        "-af","highpass=f=85,afftdn=nr=12:nf=-38:tn=1,lowpass=f=8000",
        "-ar","44100","-ac","1","-codec:a","libmp3lame","-b:a","128k",
        str(after)
    ],check=True)
    output_duration=duration(after)
    assert abs(output_duration-input_duration)<.13,(word,input_duration,output_duration)
    assert after.stat().st_size>3500,(word,after.stat().st_size)
    results.append(dict(word=word,original_duration=round(input_duration,3),
        cleaned_duration=round(output_duration,3),size=after.stat().st_size))
print(json.dumps(results,ensure_ascii=False,indent=2))
