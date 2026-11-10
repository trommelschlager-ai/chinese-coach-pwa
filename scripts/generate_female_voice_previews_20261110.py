#!/usr/bin/env python3
"""Create two identical-text Chinese female voice previews at an unmodified pitch.

Evaluation-only files. This script is separate from Panda Go lesson audio.
"""
import asyncio
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import edge_tts

OUT = Path("assets/voice-previews-20261110")
TRANSCRIPT = "字，词，知，吃，是，七，女。妈，麻，马，骂。你好。不是。一个。"
VOICES = {
    "xiaomo": "zh-CN-XiaomoNeural",
    "xiaohan": "zh-CN-XiaohanNeural",
}
RATE = "-15%"  # approx. 0.85x; no synthetic pitch shifting

async def make_sample(name, voice):
    dest = OUT / f"{name}-85.mp3"
    for attempt in range(3):
        try:
            await edge_tts.Communicate(
                text=TRANSCRIPT, voice=voice, rate=RATE, volume="+0%"
            ).save(str(dest))
            break
        except Exception:
            if attempt == 2:
                raise
            await asyncio.sleep((attempt + 1) * 4)
    assert dest.is_file() and dest.stat().st_size > 5000, f"Empty sample {name}"
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=codec_name", "-show_entries", "format=duration",
         "-of", "json", str(dest)],
        check=True, capture_output=True, text=True
    )
    media = json.loads(result.stdout)
    duration = float(media["format"]["duration"])
    assert 4 < duration < 55, f"Unexpected sample length: {duration}"
    assert any(s.get("codec_name") == "mp3" for s in media.get("streams", [])), f"Not MP3: {dest}"
    return {"file": dest.name, "voice": voice, "duration_s": round(duration, 2),
            "size_bytes": dest.stat().st_size}

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    recordings = [await make_sample(name, voice) for name, voice in VOICES.items()]
    manifest = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Noncommercial listening comparison before Panda Go narrator selection",
        "language": "zh-CN", "text": TRANSCRIPT, "rate": RATE,
        "pitch_adjustment": "none", "style": "neutral, not calm (Edge TTS does not expose SSML calm style)",
        "licensing": "Evaluation only. Commercial use rights not verified.",
        "recordings": recordings,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
