#!/usr/bin/env python3
"""Generate *trainer-only* Xiaoxiao MP3 assets with LuvVoice's documented API.

Requires LUVVOICE_API_TOKEN (Plus API access). This does not modify the 7 lessons.
Stage and listen to the archive before any approval/publishing.
"""
import argparse
import base64
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CURRICULUM = ROOT / "assets/pinyin-reading-curriculum.json"
ENDPOINT = "https://luvvoice.com/api/v1/text-to-speech"
VOICE = "voice-093"
RATE = -20

def plan():
    d = json.loads(CURRICULUM.read_text(encoding="utf-8"))
    clips = d["clips"]
    if len(clips) != 190 or len({x["id"] for x in clips}) != 190:
        raise RuntimeError("Expected exactly 190 distinct Pinyin IDs")
    rows = []
    for x in clips:
        if not x["id"].startswith("p") or len(x["id"]) != 4 or not x["id"][1:].isdigit():
            raise RuntimeError("Unsafe clip ID")
        if not x["text"] or not x["pinyin"]:
            raise RuntimeError("Empty curriculum entry")
        rows.append({"id": x["id"], "text": x["text"], "pinyin": x["pinyin"],
                     "file": x["id"] + ".mp3"})
    # All 12 other special-combination tiles reuse existing Pinyin IDs.
    # 白 bái is the only additional independent trainer recording.
    rows.append({"id": "bai", "text": "白", "pinyin": "bái", "file": "bai.mp3"})
    return rows

def validate_mp3(path):
    if not path.is_file() or path.stat().st_size < 900:
        raise RuntimeError("Missing or short MP3: " + str(path))
    check = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
        str(path)], text=True, capture_output=True, check=True)
    duration = float(check.stdout.strip())
    if not 0.12 < duration < 30:
        raise RuntimeError("Unexpected MP3 duration: " + str(path))
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path),
                    "-f", "null", "-"], check=True, stdout=subprocess.DEVNULL)
    return duration

def call_api(text, token):
    data = json.dumps({"text": text, "voice_id": VOICE, "voice_type": "standard",
                       "rate": RATE, "pitch": 0, "volume": 0}).encode("utf-8")
    request = urllib.request.Request(ENDPOINT, data=data, method="POST", headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "PandaGo-HSK1-Trainer-AudioQA"})
    with urllib.request.urlopen(request, timeout=75) as response:
        response_data = response.read(10_000_000)
    parsed = json.loads(response_data)
    if not parsed.get("success"):
        raise RuntimeError("Provider did not confirm synthesis")
    if parsed.get("audio_data"):
        return base64.b64decode(parsed["audio_data"], validate=True)
    if parsed.get("audio_url"):
        url = parsed["audio_url"]
        p = urllib.parse.urlsplit(url)
        if p.scheme != "https" or not (p.hostname == "luvvoice.com" or
             (p.hostname or "").endswith(".luvvoice.com")):
            raise RuntimeError("Unexpected audio download hostname")
        with urllib.request.urlopen(url, timeout=75) as response:
            return response.read(10_000_000)
    raise RuntimeError("No MP3 data or URL in LuvVoice response")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--out", default="assets/panda-xiaoxiao-trainer-v250")
    p.add_argument("--delay", type=float, default=7)
    a = p.parse_args()
    rows = plan()
    if a.dry_run:
        print(json.dumps({"total_unique_mp3": len(rows), "voice_id": VOICE,
            "rate": RATE, "source": "LuvVoice", "rows": rows},
            ensure_ascii=False, indent=2))
        return
    token = os.getenv("LUVVOICE_API_TOKEN", "").strip()
    if not token:
        sys.exit("LUVVOICE_API_TOKEN is missing (LuvVoice Plus API)")
    dest = pathlib.Path(a.out)
    dest.mkdir(parents=True, exist_ok=True)
    done = []
    for index, row in enumerate(rows, 1):
        target = dest / row["file"]
        if target.exists():
            try:
                validate_mp3(target)
            except Exception:
                target.unlink()
        if not target.exists():
            for attempt in range(5):
                try:
                    mp3 = call_api(row["text"], token)
                    if len(mp3) < 900:
                        raise RuntimeError("Empty audio returned")
                    target.write_bytes(mp3)
                    validate_mp3(target)
                    break
                except (RuntimeError, urllib.error.URLError, subprocess.CalledProcessError, ValueError) as ex:
                    if target.exists():
                        target.unlink()
                    if attempt == 4:
                        raise RuntimeError("Failed " + row["id"] + ": " + str(ex)) from ex
                    wait = max(a.delay, 8 * (attempt + 1))
                    print("Retry", row["id"], "after", wait, "s", flush=True)
                    time.sleep(wait)
        duration = validate_mp3(target)
        done.append({**row, "duration_s": round(duration, 3),
                     "bytes": target.stat().st_size,
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
        print(f"{index}/191: {row['id']} {row['text']} ({duration:.2f}s)", flush=True)
        if index < len(rows):
            time.sleep(max(a.delay, 6.5))
    manifest = {"schema": 1, "version": 250, "voice": "Xiaoxiao",
        "provider": "LuvVoice", "voice_id": VOICE, "rate": RATE, "pitch": 0,
        "volume": 0, "source": "pinyin-reading-curriculum.json",
        "trainer_only": True, "qualityApproved": False, "complete": True,
        "unique_mp3": 191, "total_exercises": 203, "clips": done}
    (dest / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Generated 191 unique clips for 203 buttons. Tone review still required.")

if __name__ == "__main__":
    main()
