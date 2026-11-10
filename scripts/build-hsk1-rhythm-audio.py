#!/usr/bin/env python3
"""Build HSK1 rhythm non-commercial PREVIEW MP3s.

Mandarin: same zh-CN-YunjianNeural voice referenced by dialogue v73.
Russian: ru-RU-DmitryNeural for the existing bilingual repeat exercise.
These Edge Read Aloud previews are NOT licensed here for commercial use.
Before monetization, re-render with a properly licensed service.
Every full phrase is synthesized independently: never concatenate words.
"""
from __future__ import annotations

import asyncio
import json
import pathlib
import re
import subprocess
import sys

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGE = ROOT / "hsk1-rhythm.html"
DEST = ROOT / "assets" / "hsk1-rhythm"
VOICES = {"zh": "zh-CN-YunjianNeural", "ru": "ru-RU-DmitryNeural"}
RATE = "-5%"

def read_cards() -> list[dict]:
    html = PAGE.read_text(encoding="utf-8")
    match = re.search(r"const data=\[\s*(.*?)\s*\];", html, re.S)
    if not match:
        raise RuntimeError("Cannot locate card data: do not generate mismatched recordings")
    cards = json.loads("[" + match.group(1) + "]")
    if len(cards) != 10:
        raise RuntimeError(f"Expected 10 cards, found {len(cards)}")
    for idx, card in enumerate(cards, 1):
        if not isinstance(card.get("zh"), str) or not isinstance(card.get("ru"), str):
            raise RuntimeError(f"Card {idx} missing audio text")
    return cards

def verify_audio(file: pathlib.Path) -> None:
    if not file.is_file() or file.stat().st_size < 1500:
        raise RuntimeError(f"Empty recording: {file}")
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name:format=duration",
         "-of", "json", str(file)],
        text=True, capture_output=True, check=True
    )
    payload = json.loads(result.stdout)
    duration = float(payload["format"]["duration"])
    codecs = [stream.get("codec_name") for stream in payload.get("streams", [])]
    if duration < .35 or "mp3" not in codecs:
        raise RuntimeError(f"Incorrect audio data: {file}, {duration}, {codecs}")

async def generate_audio(text: str, voice: str, destination: pathlib.Path) -> None:
    for attempt in range(1, 4):
        temporary = destination.with_suffix(".tmp.mp3")
        try:
            temporary.unlink(missing_ok=True)
            await edge_tts.Communicate(text, voice=voice, rate=RATE).save(str(temporary))
            verify_audio(temporary)
            temporary.replace(destination)
            return
        except Exception as error:
            temporary.unlink(missing_ok=True)
            if attempt == 3:
                raise RuntimeError(f"Failed: {destination.name}: {error}") from error
            await asyncio.sleep(attempt * 3)

async def main() -> None:
    cards = read_cards()
    DEST.mkdir(parents=True, exist_ok=True)
    for idx, card in enumerate(cards, 1):
        for lang in ("zh", "ru"):
            target = DEST / f"{lang}-{idx:02d}.mp3"
            await generate_audio(card[lang], VOICES[lang], target)
            print(f"OK {target.relative_to(ROOT)}: {card[lang]}", flush=True)
        await asyncio.sleep(.5)
    paths = [DEST / f"{lang}-{idx:02d}.mp3"
             for idx in range(1, 11) for lang in ("zh", "ru")]
    for path in paths:
        verify_audio(path)
    manifest = {
        "version": 1, "ready": True, "count": len(cards),
        "files": [str(path.relative_to(ROOT)) for path in paths],
        "voices": VOICES, "rate": RATE,
        "license_status": "non-commercial Edge Read Aloud preview; no verified commercial redistribution grant",
        "tone_validation": "not yet manually validated",
        "source": "edge-tts personal evaluation",
    }
    (DEST / "status.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("READY: 10 Mandarin and 10 Russian recordings", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
