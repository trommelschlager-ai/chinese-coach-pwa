#!/usr/bin/env python3
"""Prepare HSK1 0–99 exercise audio from the EXISTING licensed Yue Tan samples.

The prepared 0–99 files are concatenations of isolated Mandarin digits from one
native speaker, *not* newly recorded fluent phrases. No voice cloning.
Natural 一百 (yì bǎi) is not generated, because isolated 一 is yī. The
client uses a distinctly labeled Chinese TTS fallback for 100.
Attribution and source license in docs/HSK1-NUMBERS-AUDIO-v213.md.
"""
from __future__ import annotations
from pathlib import Path
from array import array
from tempfile import TemporaryDirectory
import json
import math
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'yue-tan-human-v166.json'
OUTPUT = ROOT / 'assets' / 'hsk1-numbers-clean-v213'
MANIFEST = ROOT / 'assets' / 'hsk1-numbers-audio-map-v213.js'
BASE = list("零一二三四五六七八九十百")
RATE = 44100


def run(*args):
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          text=True, check=True)


def digits_of(n: int) -> str:
    chars = "零一二三四五六七八九"
    if n == 0:
        return "零"
    if n < 10:
        return chars[n]
    if n == 10:
        return "十"
    if n < 20:
        return "十" + chars[n % 10]
    return chars[n // 10] + "十" + (chars[n % 10] if n % 10 else "")


def read(path):
    with wave.open(str(path), 'rb') as f:
        assert (f.getnchannels(), f.getsampwidth(), f.getframerate()) == (1, 2, RATE)
        result = array('h')
        result.frombytes(f.readframes(f.getnframes()))
        if sys.byteorder == "big":
            result.byteswap()
        return result


def wav(path, pcm):
    buf = array('h', pcm)
    if sys.byteorder == "big":
        buf.byteswap()
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(buf.tobytes())


def normalize(data, word):
    n = len(data)
    if n < RATE // 5:
        raise ValueError("Short decoded voice for " + word)
    # RMS activity detects speech, trimming only silence with generous padding.
    frame = RATE // 100
    peaks = []
    for i in range(0, n, frame):
        v = data[i:i + frame]
        rms = math.sqrt(sum(int(x) * int(x) for x in v) / len(v)) / 32768
        peaks.append(rms)
    peak = max(peaks)
    if peak < 0.002:
        raise ValueError("Silence in " + word)
    threshold = max(0.003, min(0.012, peak * 0.12))
    active = [i for i, p in enumerate(peaks) if p > threshold]
    start = max(0, active[0] * frame - int(RATE * .055))
    end = min(n, (active[-1] + 1) * frame + int(RATE * .07))
    buf = data[start:end]
    if len(buf) < int(RATE * .20):
        raise ValueError("Suspiciously short spoken sample " + word)
    rms = math.sqrt(sum(int(x) * int(x) for x in buf) / len(buf)) / 32768
    peak = max(abs(v) for v in buf) / 32768
    # Conservative output level; retain authentic tone contour.
    gain = min(2.5, max(.70, .12 / max(.0001, rms)), .88 / peak)
    fade = min(len(buf) // 15, int(RATE * .020))
    result = array('h')
    for i, v in enumerate(buf):
        envelope = min(1.0, (i + 1) / max(1, fade), (len(buf) - i) / max(1, fade))
        result.append(int(max(-32000, min(32000, round(v * gain * envelope)))))
    return result


def main():
    original = json.loads(SOURCE.read_text('utf-8'))
    sources = {x['hanzi']: ROOT / x['path'].removeprefix('./')
               for x in original['items']}
    missing = [x for x in BASE if x not in sources]
    if missing:
        raise ValueError('Unrecorded human words: ' + repr(missing))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    result = {}
    all_seconds = 0.
    with TemporaryDirectory(prefix='panda-hsk1-213-') as folder:
        tmp = Path(folder)
        cleaned = {}
        for char in BASE:
            source = sources[char]
            if not source.is_file():
                raise ValueError('Missing licensed source for ' + char)
            decoded = tmp / (str(ord(char)) + '.wav')
            # Gentle broadband noise reduction (NOT automatic voice generation).
            run('ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
                '-i',str(source),'-vn','-af',
                'highpass=f=70,afftdn=nr=8:nf=-43',
                '-ar',str(RATE),'-ac','1','-c:a','pcm_s16le',str(decoded))
            cleaned[char] = normalize(read(decoded), char)
        gap = array('h', [0]) * int(RATE * .052)
        for n in range(100):
            text = digits_of(n)
            parts = array('h')
            for k, char in enumerate(text):
                if k:
                    parts.extend(gap)
                parts.extend(cleaned[char])
            intermediate = tmp / f'{n:03d}.wav'
            wav(intermediate, parts)
            final = OUTPUT / f'{n:03d}.mp3'
            run('ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
                '-i',str(intermediate),'-codec:a','libmp3lame','-b:a','128k',
                str(final))
            if final.stat().st_size < 3000:
                raise ValueError('Audio result too small ' + str(final))
            result[text] = './assets/hsk1-numbers-clean-v213/' + final.name
            all_seconds += len(parts) / RATE
    intro = """/* HSK1 numbers audio v213. Same original Yue Tan speaker throughout.
 * Cleaned/level-matched/stitched from existing licensed clips (CC BY-SA 3.0 US).
 * Splices do NOT equal native speaker recording a complete number.
 * 一百 requires yì bǎi; not fabricated from first-tone yī. */
"""
    MANIFEST.write_text(intro +
        'window.PANDA_HSK1_L3_CLEAN_V213=Object.freeze(' +
        json.dumps(result,ensure_ascii=False,indent=2) + ');\n',
        encoding='utf-8')
    print(f'Created {len(result)} prepared 0–99 samples; {all_seconds:.1f} seconds.')
    print('100: intentionally no audio. Use labeled yì bǎi TTS fallback.')
    print('Manual Mandarin native-tone listening QA is still required.')


if __name__ == '__main__':
    main()
