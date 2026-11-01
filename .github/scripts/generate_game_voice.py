#!/usr/bin/env python3
"""Build one consistent, clean Mandarin voice for the Game Practice section only.
All existing artwork, lessons, audio sources and game logic remain untouched.
"""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "game-unified-voice-v100"
VOICE = "zh-CN-YunyangNeural"
WORDS = [
    "我", "叫", "小明", "是", "中国人", "你", "住", "在", "哪里",
    "现在", "几", "点", "想", "喝", "一", "杯", "茶", "什么",
    "名字", "二十五", "岁", "三", "很", "好", "谢谢", "多",
    "大", "吗", "不",
]
SENTENCES = {
    "name": "我叫小明。",
    "country": "我是中国人。",
    "where": "你住在哪里？",
    "time": "现在几点？",
    "tea": "我想喝一杯茶。",
    "askname": "你叫什么名字？",
    "age": "我二十五岁。",
    "three": "现在三点。",
    "fine": "我很好，谢谢！",
    "howold": "你多大？",
}

def file_for_word(word):
    return "word-" + "-".join(format(ord(c), "x") for c in word) + ".mp3"

async def generate_audio(text, output):
    if output.is_file() and output.stat().st_size > 1000:
        return
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.mp3"
        for attempt in range(1, 4):
            try:
                await edge_tts.Communicate(
                    text, voice=VOICE, rate="+0%", volume="+0%"
                ).save(str(raw))
                break
            except Exception:
                if attempt == 3:
                    raise
                await asyncio.sleep(attempt * 3)
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(raw),
            "-af", "highpass=f=95,lowpass=f=8000,loudnorm=I=-18:TP=-2:LRA=9,afade=t=in:st=0:d=0.015",
            "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame",
            "-q:a", "4", str(output),
        ], check=True)
        if output.stat().st_size < 1000:
            raise RuntimeError("Generated MP3 too small: " + str(output))

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [(w, OUT / file_for_word(w)) for w in WORDS]
    jobs += [(phrase, OUT / ("sentence-" + key + ".mp3")) for key, phrase in SENTENCES.items()]
    gate = asyncio.Semaphore(2)
    async def run(text, path):
        async with gate:
            await generate_audio(text, path)
            print(path.name, path.stat().st_size, flush=True)
    await asyncio.gather(*(run(text, path) for text, path in jobs))
    manifest = {
        "voice": VOICE,
        "notes": "One clean voice across all word buttons and complete sentences. No ambient recordings.",
        "words": {w: "./assets/game-unified-voice-v100/" + file_for_word(w) for w in WORDS},
        "sentences": {k: "./assets/game-unified-voice-v100/sentence-" + k + ".mp3" for k in SENTENCES},
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

if __name__ == "__main__":
    asyncio.run(main())
