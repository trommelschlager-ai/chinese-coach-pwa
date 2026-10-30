#!/usr/bin/env python3
"""Generate MP3 previews for the optional pinyin-combinations practice panel.
The recordings use Microsoft Edge Read Aloud for personal evaluation;
commercial distribution requires appropriately licensed replacement audio.
"""
from __future__ import annotations
import asyncio
import json
import pathlib
import subprocess
import sys
import time

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/pinyin-combinations"
VOICE = "zh-CN-XiaoxiaoNeural"
SYLLABLES = {
    "zhi": "知",
    "chi": "吃",
    "shi": "诗",
    "zi": "字",
    "ci": "次",
    "si": "四",
    "pai": "拍",
    "bai": "白",
    "mai": "买",
    "ji": "鸡",
    "qi": "七",
    "xi": "西",
    "nü": "女",
}


def checked_mp3(path: pathlib.Path) -> bool:
    if not path.exists() or path.stat().st_size < 1600:
        return False
    with path.open("rb") as stream:
        data = stream.read(3)
    if data != b"ID3" and not (len(data) >= 2 and data[0] == 255 and (data[1] & 0xE0) == 0xE0):
        return False
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True, capture_output=True, check=False,
    )
    try:
        return result.returncode == 0 and float(result.stdout.strip()) >= .20
    except ValueError:
        return False


async def generate(syllable: str, hanzi: str) -> None:
    target = OUT / (syllable + ".mp3")
    if checked_mp3(target):
        print("EXISTS", syllable, flush=True)
        return
    for attempt in range(1, 5):
        tmp = OUT / (syllable + ".tmp.mp3")
        try:
            await edge_tts.Communicate(hanzi, voice=VOICE, rate="-4%").save(str(tmp))
            if not checked_mp3(tmp):
                raise RuntimeError("Received an invalid MP3")
            tmp.replace(target)
            print("OK", syllable, hanzi, target.stat().st_size, flush=True)
            return
        except Exception as exc:
            tmp.unlink(missing_ok=True)
            print("RETRY", syllable, attempt, repr(exc), file=sys.stderr, flush=True)
            if attempt == 4:
                raise
            await asyncio.sleep(attempt * 3)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    assert len(SYLLABLES) == 13
    for syllable, hanzi in SYLLABLES.items():
        await generate(syllable, hanzi)
        await asyncio.sleep(.5)
    assert all(checked_mp3(OUT / (syllable + ".mp3")) for syllable in SYLLABLES)

    worker = ROOT / "sw.js"
    sw = worker.read_text(encoding="utf-8")
    assert sw.count("chinese-coach-pwa-v62") == 1
    worker.write_text(sw.replace("chinese-coach-pwa-v62", "chinese-coach-pwa-v63"), encoding="utf-8")

    offline = ROOT / "assets/offline-pack.json"
    pack = json.loads(offline.read_text(encoding="utf-8"))
    assert pack["version"] == 62
    paths = ["./assets/pinyin-combinations/" + x + ".mp3" for x in SYLLABLES]
    pack["files"] = sorted(set(pack["files"]) | set(paths))
    pack["version"] = 63
    pack["bytes"] = pack["bytes"] + sum((OUT / (x + ".mp3")).stat().st_size for x in SYLLABLES)
    offline.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    status = {
        "ready": True, "count": len(SYLLABLES), "voice": VOICE,
        "use": "Noncommercial evaluation; replace with licensed Azure Speech recordings before paid distribution",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    (OUT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("FINISHED", len(SYLLABLES), "valid MP3 examples", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
