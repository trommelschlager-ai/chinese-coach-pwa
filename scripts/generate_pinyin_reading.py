#!/usr/bin/env python3
"""Build complete A-to-Z Hanyu Pinyin pronunciation-preview recordings.
Source: Edge Read Aloud. Preview only. For commercial use, regenerate with a
service whose terms explicitly permit commercial redistribution (Azure Speech).
"""
from __future__ import annotations
import asyncio
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "assets/pinyin-reading-curriculum.json"
OUT = ROOT / "assets/pinyin-reading"
LEGACY = ROOT / "assets/pinyin-combinations"
VOICE = "zh-CN-XiaoxiaoNeural"
LEGACY_SAMPLES = {
    "知": "zhi", "吃": "chi", "诗": "shi", "字": "zi", "次": "ci",
    "四": "si", "拍": "pai", "白": "bai", "买": "mai",
    "鸡": "ji", "七": "qi", "西": "xi", "女": "nü",
}


def valid_mp3(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size < 1500:
        return False
    with path.open("rb") as stream:
        magic = stream.read(3)
    if magic != b"ID3" and not (len(magic) > 1 and magic[0] == 255 and magic[1] & 0xE0 == 0xE0):
        return False
    result = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ], capture_output=True, text=True, check=False)
    try:
        return result.returncode == 0 and float(result.stdout.strip()) >= .18
    except ValueError:
        return False


async def generate_one(item: dict) -> None:
    path = ROOT / item["file"]
    assert path.parent == OUT and path.name == item["id"] + ".mp3"
    if valid_mp3(path):
        print("REUSE", path.name, flush=True)
        return
    old_name = LEGACY_SAMPLES.get(item["text"])
    if old_name:
        old = LEGACY / (old_name + ".mp3")
        if valid_mp3(old):
            shutil.copyfile(old, path)
            print("COPY", path.name, item["text"], flush=True)
            return
    for attempt in range(1, 5):
        tmp = path.with_suffix(".tmp.mp3")
        try:
            await edge_tts.Communicate(item["text"], voice=VOICE, rate="-3%").save(str(tmp))
            if not valid_mp3(tmp):
                raise RuntimeError("Invalid MP3 received")
            tmp.replace(path)
            print("OK", path.name, item["text"], item["pinyin"], flush=True)
            return
        except Exception as exc:
            tmp.unlink(missing_ok=True)
            print("ERROR", path.name, attempt, repr(exc), file=sys.stderr, flush=True)
            if attempt == 4:
                raise
            await asyncio.sleep(attempt * 4)


async def main() -> None:
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    assert len(plan["groups"]) == 26
    assert len(plan["rules"]) == 21
    clips = plan["clips"]
    assert len(clips) >= 80
    assert len({e["id"] for e in clips}) == len(clips)
    assert len({e["text"] for e in clips}) == len(clips)
    OUT.mkdir(parents=True, exist_ok=True)
    for item in clips:
        await generate_one(item)
        await asyncio.sleep(.4)
    if not all(valid_mp3(ROOT / item["file"]) for item in clips):
        raise RuntimeError("Some MP3 files missing or invalid")
    status = {
        "ready": True, "count": len(clips),
        "voice": VOICE, "curriculum_version": plan["version"],
        "usage": "Evaluation only; replace with licensed recordings before paid distribution",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    (OUT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("DONE", len(clips), "verified MP3 files", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
