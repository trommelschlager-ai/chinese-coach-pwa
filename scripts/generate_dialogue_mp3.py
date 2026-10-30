#!/usr/bin/env python3
"""Generate 25 Mandarin dialogue clips for personal evaluation.
Commercial distribution must use a suitably licensed speech service.
Run: pip install edge-tts==7.3.1 && python scripts/generate_dialogue_mp3.py
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
PLAN = ROOT / "assets/dialogue-voice-plan.json"
OUT = ROOT / "assets/dialogue-voices"
VOICES = {"A": "zh-CN-XiaoxiaoNeural", "B": "zh-CN-YunxiNeural"}


def valid_mp3(path: pathlib.Path) -> bool:
    if not path.exists() or path.stat().st_size < 1800:
        return False
    with path.open("rb") as file:
        head = file.read(3)
    if head != b"ID3" and not (head[0] == 255 and (head[1] & 0xE0) == 0xE0):
        return False
    completed = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=False,
    )
    try:
        return completed.returncode == 0 and float(completed.stdout.strip()) >= .25
    except ValueError:
        return False


async def generate_one(entry: dict) -> None:
    speaker = entry["speaker"]
    assert speaker in VOICES
    path = ROOT / entry["file"]
    assert OUT in path.parents and path.suffix == ".mp3"
    for attempt in range(1, 5):
        tmp = path.with_suffix(".tmp.mp3")
        try:
            await edge_tts.Communicate(entry["text"], voice=VOICES[speaker], rate="-4%").save(str(tmp))
            if not valid_mp3(tmp):
                raise RuntimeError(f"Invalid or silent MP3: {tmp}")
            tmp.replace(path)
            print(f"OK {path.name} ({path.stat().st_size} bytes) {VOICES[speaker]} {entry['text']}", flush=True)
            return
        except Exception as exc:
            tmp.unlink(missing_ok=True)
            print(f"TRY {attempt} failed {path.name}: {exc}", file=sys.stderr, flush=True)
            if attempt == 4:
                raise
            await asyncio.sleep(attempt * 4)


async def main() -> None:
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    entries = plan["entries"]
    assert len(entries) == 25
    assert sum(entry["speaker"] == "A" for entry in entries) == 13
    assert sum(entry["speaker"] == "B" for entry in entries) == 12
    OUT.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        if valid_mp3(ROOT / entry["file"]):
            print(f"REUSE {entry['file']}", flush=True)
        else:
            await generate_one(entry)
        await asyncio.sleep(.6)
    if not all(valid_mp3(ROOT / entry["file"]) for entry in entries):
        raise RuntimeError("Incomplete dialogue recordings")
    lookup = {f"{entry['lesson']}-{entry['line']}": "./" + entry["file"] for entry in entries}
    js = "// Generated only after all 25 MP3 files pass validation.\n"
    js += "window.dialogueVoiceAudio=" + json.dumps(lookup, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "assets/dialogue-voices-map.js").write_text(js, encoding="utf-8")
    # Include all 25 generated clips in the existing offline-download pack.
    offline = ROOT / "assets/offline-pack.json"
    manifest = json.loads(offline.read_text(encoding="utf-8"))
    paths = ["./" + entry["file"] for entry in entries]
    manifest["files"] = sorted(set(manifest["files"]) | set(paths))
    manifest["bytes"] = max(
        manifest.get("bytes", 0),
        sum((ROOT / entry["file"]).stat().st_size for entry in entries),
    ) + sum((ROOT / entry["file"]).stat().st_size for entry in entries)
    manifest["version"] = 58
    offline.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    # Cache busting forces preinstalled Android PWAs to see the new recordings.
    service_worker = ROOT / "sw.js"
    sw = service_worker.read_text(encoding="utf-8")
    if "chinese-coach-pwa-v57" not in sw:
        raise RuntimeError("Unexpected PWA service worker version; review before publish")
    service_worker.write_text(sw.replace("chinese-coach-pwa-v57", "chinese-coach-pwa-v58"), encoding="utf-8")
    status = {"ready": True, "count": len(entries), "voices": VOICES,
              "source": "edge-tts (Microsoft Edge Read Aloud); personal evaluation only",
              "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    (OUT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("DONE 25 checked MP3s", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
