#!/usr/bin/env python3
"""Two exact-text personal PREVIEW recordings for the greeting lesson.
Edge Read Aloud previews are NOT cleared for commercial redistribution.
Replace with suitably licensed native/paid-TTS speech before course sale.
"""
from __future__ import annotations
import asyncio
import json
import pathlib
import subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "dialogue-greetings-v113"
CLIPS = (
    ("l2-01-a.mp3", "你好！", "zh-CN-XiaoxuanNeural", "female"),
    ("l2-02-b.mp3", "哈喽！", "zh-CN-YunjianNeural", "male"),
)

def validate(path: pathlib.Path):
    data = path.read_bytes()
    if len(data) < 2000 or (data[:3] != b"ID3" and not (data[0] == 255 and (data[1] & 0xE0) == 0xE0)):
        raise RuntimeError(f"Invalid MP3: {path}")
    duration = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)], text=True
    ).strip()
    if not 0.3 < float(duration) < 12:
        raise RuntimeError(f"Invalid duration: {path}: {duration}")
    return len(data)

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for filename, text, voice, role in CLIPS:
        path = OUT / filename
        tmp = OUT / (filename + ".partial.mp3")
        await edge_tts.Communicate(text, voice=voice, rate="-6%").save(str(tmp))
        validate(tmp)
        tmp.replace(path)
        print(filename, role, voice, text, validate(path), flush=True)
    manifest = {"ready": True, "count": 2, "version": 113,
                "commercial_use": False, "source": "Edge Read Aloud personal evaluation only",
                "clips": [{"file": filename, "text": text, "voice": voice, "role": role}
                          for filename, text, voice, role in CLIPS]}
    (OUT / "status.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    pack_path = ROOT / "assets" / "offline-pack.json"
    pack = json.loads(pack_path.read_text(encoding="utf8"))
    resources = ["./assets/dialogue-greetings-v113/" + p[0] for p in CLIPS] + ["./assets/dialogue-greetings-v113/status.json"]
    pack["files"] = sorted(set(pack["files"]) | set(resources))
    pack["version"] = max(pack["version"], 113)
    pack["bytes"] = int(pack.get("bytes", 0)) + sum((OUT / p[0]).stat().st_size for p in CLIPS)
    pack_path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("Verified 2 greeting MP3s and offline manifest.", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
