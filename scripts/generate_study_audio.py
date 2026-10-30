#!/usr/bin/env python3
"""Produce 30 Xiaoxiao Mandarin speech previews for vocabulary/rules.
These use Edge Read Aloud; do not use them in a paid product without appropriate rights.
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
PLAN = ROOT / "assets/study-audio-plan.json"
OUT = ROOT / "assets/study-voices"
VOICE = "zh-CN-XiaoxiaoNeural"


def valid(path):
    if not path.exists() or path.stat().st_size < 1800:
        return False
    with path.open("rb") as file:
        head = file.read(3)
    if head != b"ID3" and not (head[0] == 255 and (head[1] & 0xE0) == 0xE0):
        return False
    job = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=False
    )
    try:
        return job.returncode == 0 and float(job.stdout.strip()) > 0.2
    except ValueError:
        return False


async def one(entry):
    target = ROOT / entry["file"]
    assert OUT in target.parents and target.suffix == ".mp3"
    if valid(target):
        print("REUSE", target.name, flush=True)
        return
    for attempt in range(1, 5):
        temp = target.with_suffix(".tmp.mp3")
        try:
            await edge_tts.Communicate(
                entry["spoken"], voice=VOICE, rate="-3%"
            ).save(str(temp))
            if not valid(temp):
                raise RuntimeError("Invalid MP3 produced")
            temp.replace(target)
            print("OK", target.name, entry["spoken"], flush=True)
            return
        except Exception as exc:
            temp.unlink(missing_ok=True)
            print("RETRY", attempt, target.name, repr(exc), file=sys.stderr, flush=True)
            if attempt == 4:
                raise
            await asyncio.sleep(attempt * 3)


async def main():
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    entries = plan["entries"]
    assert len(entries) == 30
    assert len({e["key"] for e in entries}) == len(entries)
    assert all(e["voice"] == VOICE for e in entries)
    OUT.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        await one(entry)
        await asyncio.sleep(.5)
    assert all(valid(ROOT / entry["file"]) for entry in entries)

    audio_map = {e["key"]: "./" + e["file"] for e in entries}
    map_source = "// Verified 30 natural-sounding Mandarin speech previews; commercial license not granted.\n"
    map_source += "window.courseNaturalAudio=" + json.dumps(audio_map, ensure_ascii=False) + ";\n"
    (ROOT / "assets/study-audio-map.js").write_text(map_source, encoding="utf-8")

    index = ROOT / "index.html"
    html = index.read_text(encoding="utf-8")
    old = '<script src="./assets/human-audio-map.js?v=49"></script>'
    assert html.count(old) == 1, "Unexpected course entrypoint"
    html = html.replace(old, old + '\n<script src="./assets/study-audio-map.js?v=59"></script>')
    index.write_text(html, encoding="utf-8")

    worker = ROOT / "sw.js"
    sw = worker.read_text(encoding="utf-8")
    assert "chinese-coach-pwa-v58" in sw
    sw = sw.replace("chinese-coach-pwa-v58", "chinese-coach-pwa-v59")
    old_core = "'./assets/human-audio-map.js?v=49'"
    assert sw.count(old_core) == 1
    sw = sw.replace(old_core, old_core + ",'./assets/study-audio-map.js?v=59'")
    worker.write_text(sw, encoding="utf-8")

    pack = ROOT / "assets/offline-pack.json"
    manifest = json.loads(pack.read_text(encoding="utf-8"))
    assert manifest["version"] == 58
    paths = ["./" + e["file"] for e in entries]
    manifest["files"] = sorted(set(manifest["files"]) | set(paths) | {"./assets/study-audio-map.js?v=59"})
    manifest["bytes"] = manifest.get("bytes", 0) + sum((ROOT / e["file"]).stat().st_size for e in entries)
    manifest["version"] = 59
    pack.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    status = {"ready": True, "count": len(entries), "voice": VOICE,
              "source": "edge-tts Microsoft Edge Read Aloud, personal evaluation only",
              "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    (OUT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("COMPLETE verified 30 MP3s", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
