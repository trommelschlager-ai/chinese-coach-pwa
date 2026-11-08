#!/usr/bin/env python3
"""Create optional HSK1 Lesson 2 voice pack from ONE existing licensed Yue Tan voice.

All ordinary words and two examples use the SAME source speaker.
Only the already established male/female dialogue remains separate.
This does not synthesize someone's voice, alter pitch or claim to record unavailable
characters (您), greeting (你好), or the particle 的.
"""
from __future__ import annotations
from array import array
from pathlib import Path
import json
import math
import re
import subprocess
import sys
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "hsk1-voice-unified-v208"
SOURCE_MAP = (ROOT / "assets" / "hsk1-native-human-map-v167.js").read_text("utf-8")
RATE = 44100
WORDS = {
    "我": "wo", "你": "ni", "他": "ta_he", "她": "ta_she",
    "它": "ta_it", "我们": "women", "你们": "nimen",
    "老师": "laoshi", "学生": "xuesheng", "是": "shi", "吗": "ma",
}
PHRASES = {
    "im_teacher": ["我", "是", "老师"],
    "are_you_teacher": ["你", "是", "老师", "吗"],
}

def execute(*args):
    return subprocess.run(args, check=True, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, text=True)

def source_file(word):
    match = re.search(r'"' + re.escape(word) + r'"\s*:\s*"([^"]+)"', SOURCE_MAP)
    if not match:
        raise RuntimeError(f"No licensed original Yue Tan audio for {word}")
    item = ROOT / match.group(1).removeprefix("./")
    if not item.is_file():
        raise RuntimeError(f"Original recording missing for {word}: {item}")
    return item

def read_wav(path):
    with wave.open(str(path), "rb") as wav:
        assert wav.getnchannels() == 1, path
        assert wav.getsampwidth() == 2, path
        assert wav.getframerate() == RATE, path
        pcm = array("h")
        pcm.frombytes(wav.readframes(wav.getnframes()))
        if sys.byteorder != "little":
            pcm.byteswap()
        return pcm

def write_wav(path, pcm):
    copied = array("h", pcm)
    if sys.byteorder != "little":
        copied.byteswap()
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(copied.tobytes())

def clean_and_trim(samples):
    if not samples:
        raise RuntimeError("Empty MP3 decode")
    frame = max(1, RATE // 100)
    peak = max(abs(x) for x in samples) / 32768
    if peak < 0.006:
        raise RuntimeError("Source is unexpectedly silent")
    threshold = max(0.0025, peak * 0.036)
    active = []
    for i in range(0, len(samples), frame):
        sample = samples[i:i+frame]
        level = math.sqrt(sum(x*x for x in sample) / max(1, len(sample))) / 32768
        if level >= threshold:
            active.append(i)
    if not active:
        raise RuntimeError("No spoken activity detected")
    start = max(0, active[0] - int(RATE * .045))
    stop = min(len(samples), active[-1] + frame + int(RATE * .055))
    voice = samples[start:stop]
    # Keep complete vowels and lexical pitch contours: time/pitch untouched.
    if len(voice) < int(RATE * .18):
        raise RuntimeError("Suspiciously short spoken sample")
    rms = math.sqrt(sum(x*x for x in voice) / max(1, len(voice))) / 32768
    peak = max(abs(x) for x in voice) / 32768
    gain = min(2.6, max(.65, .085 / max(.001,rms)), .88 / max(.001,peak))
    fade = max(1, min(int(RATE*.018),len(voice)//10))
    normalized = array("h")
    for i, raw in enumerate(voice):
        edge = min(1.0, (i+1)/fade, (len(voice)-i)/fade)
        normalized.append(round(max(-32767, min(32767, raw * gain * edge))))
    return normalized

def encode(pcm, path, tmp):
    temp = tmp / (path.stem + ".wav")
    write_wav(temp, pcm)
    execute("ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(temp), "-codec:a", "libmp3lame", "-b:a", "160k", str(path))
    if path.stat().st_size < 4000:
        raise RuntimeError(f"Invalid generated audio: {path}")

OUTPUT.mkdir(parents=True,exist_ok=True)
processed = {}
reports = []
with tempfile.TemporaryDirectory(prefix="hsk1-v208-") as td:
    tmp = Path(td)
    for word, filename in WORDS.items():
        original = source_file(word)
        raw_file = tmp / (filename+"_raw.wav")
        # Very gentle broadband denoise: avoid destroying the native tone contours.
        execute("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
                "-i",str(original),"-vn","-af",
                "highpass=f=75,afftdn=nr=8:nf=-43",
                "-ac","1","-ar",str(RATE),"-c:a","pcm_s16le",str(raw_file))
        clean = clean_and_trim(read_wav(raw_file))
        processed[word] = clean
        dest = OUTPUT / (filename+".mp3")
        encode(clean, dest, tmp)
        reports.append({"word":word,"source":str(original.relative_to(ROOT)),
                        "output":str(dest.relative_to(ROOT)),
                        "duration":round(len(clean)/RATE,3)})
    for filename, parts in PHRASES.items():
        silence = array("h",[0]) * int(RATE*.065)
        stitched = array("h")
        for i, word in enumerate(parts):
            if i:
                stitched.extend(silence)
            stitched.extend(processed[word])
        dest = OUTPUT/(filename+".mp3")
        encode(stitched, dest, tmp)
        reports.append({"phrase":filename,"segments":parts,
                        "duration":round(len(stitched)/RATE,3),
                        "output":str(dest.relative_to(ROOT))})
print(json.dumps(reports,ensure_ascii=False,indent=2))
