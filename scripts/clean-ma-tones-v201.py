#!/usr/bin/env python3
"""Denoise ONLY the existing authorized human ma2/ma3 tone examples.
The waveforms and contours remain those of the original Mandarin speaker.
Do not synthesize, repitch, trim words, or touch ma1/ma4.
"""
from pathlib import Path
import json
import subprocess

BASE = Path("assets/course-human")
OUT = Path("assets/hsk1-tone-clean-v201")
OUT.mkdir(parents=True, exist_ok=True)
PAIRS = [("麻", "ma2"), ("马", "ma3")]


def probe(path):
    data = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "json", str(path)
    ], text=True)
    return float(json.loads(data)["format"]["duration"])


for hanzi, slug in PAIRS:
    source = BASE / ("cmn-" + hanzi + ".mp3")
    target = OUT / (slug + ".mp3")
    if not source.is_file():
        raise SystemExit("Missing original licensed recording: " + str(source))
    duration = probe(source)
    if not 0.2 <= duration <= 15:
        raise SystemExit("Unexpected source duration: " + str(source))
    # Stationary background reduction without time stretching or pitch shifts.
    # Broad Mandarin speech frequencies retained: only low rumble and high hiss
    # are cut. Very short fades prevent clicks, not a shortened third tone.
    chain = (
        "highpass=f=85,"
        "afftdn=nr=14:nf=-32:nt=w,"
        "lowpass=f=7500,"
        "alimiter=limit=0.93,"
        "afade=t=in:st=0:d=0.025"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(source), "-vn", "-ac", "1", "-ar", "44100",
        "-af", chain, "-codec:a", "libmp3lame", "-q:a", "3", str(target)
    ], check=True)
    cleaned = probe(target)
    if abs(cleaned - duration) > 0.12:
        raise SystemExit("Denoised pronunciation duration unexpectedly changed")
    if target.stat().st_size < 2500:
        raise SystemExit("Audio too short/invalid: " + str(target))
    print(f"{hanzi}: {duration:.3f}s original -> {cleaned:.3f}s cleaned, {target.stat().st_size} bytes")
