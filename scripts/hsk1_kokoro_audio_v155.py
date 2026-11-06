#!/usr/bin/env python3
"""Panda Go: offline, two-voice Mandarin audio candidate production.

No API keys or paid services. Safe modes:
  python scripts/hsk1_kokoro_audio_v155.py --plan
  python scripts/hsk1_kokoro_audio_v155.py --render-samples
  python scripts/hsk1_kokoro_audio_v155.py --render-all

Files are written to local staging, NOT deployed to the app.
Review every tone and role before copying clips into a production release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
LESSONS = ROOT / "assets/hsk1-foundations-data-v152.js"
STAGING = ROOT / ".voice-staging/hsk1-kokoro-v155"
MODEL = "hexgrad/Kokoro-82M"
VOICE_IDS = {"female": "zf_xiaoxiao", "male": "zm_yunjian"}
LICENSE = "Apache-2.0"
SAMPLE_TEXTS = {
    ("female", "我"),
    ("female", "你好！"),
    ("male", "你好！"),
    ("female", "我是老师。"),
    ("male", "你是老师吗？"),
    ("female", "今天很冷。"),
}


def load_topics():
    src = LESSONS.read_text(encoding="utf-8")
    head = "window.PANDA_HSK1_FOUNDATIONS ="
    if head not in src:
        raise ValueError("Unexpected course data format")
    payload = src.split(head, 1)[1].strip()
    if not payload.endswith(";"):
        raise ValueError("Expected JS data object terminator")
    topics = json.loads(payload[:-1])
    if len(topics) != 7:
        raise ValueError("Expected exactly seven approved HSK 1 topics")
    return topics


def build_queue(topics):
    rows = {}
    def add(text, role, origin, pinyin=None):
        text = text.strip()
        if not text or role not in VOICE_IDS:
            raise ValueError(f"Invalid line: {origin}")
        key = (role, text)
        if key not in rows:
            digest = hashlib.sha256(f"{role}\0{text}".encode("utf-8")).hexdigest()[:20]
            rows[key] = {
                "role": role,
                "voice": VOICE_IDS[role],
                "text": text,
                "filename": f"{digest}.mp3",
                "origins": [],
                "review": "pending_native_tone_check",
            }
        rows[key]["origins"].append(origin)
        if pinyin:
            rows[key].setdefault("pinyin_reference", pinyin)
    for topic in topics:
        name = topic["id"]
        for chars, py, _ru in topic["words"]:
            add(chars, "female", f"{name}.words", py)
        for title, _rule, chars, py, _ru in topic["rules"]:
            add(chars, "female", f"{name}.rule.{title}", py)
        for speaker, chars, py, _ru in topic["dialogue"]:
            # Stable roles: A = man, B = woman throughout the seven lessons.
            add(chars, "male" if speaker == "А" else "female", f"{name}.dialogue.{speaker}", py)
        for item in topic.get("builds", [topic["build"]]):
            add("".join(item["target"]), "female", f"{name}.build", item.get("py"))
        item = topic["speech"]
        add(item["hz"], "female", f"{name}.speech", item.get("py"))
    return sorted(rows.values(), key=lambda x: (x["role"], x["text"]))


def save_plan(rows, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "status": "CANDIDATES_ONLY_NOT_APPROVED_FOR_RELEASE",
        "model": MODEL,
        "model_license": LICENSE,
        "voices": VOICE_IDS,
        "approval": "Listen to both voices and validate Mandarin tones and pronunciation before release.",
        "sentences": rows,
    }
    dest.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def synthesize(rows):
    try:
        from kokoro import KPipeline
        import numpy as np
        import soundfile as sf
    except ImportError as e:
        raise SystemExit("Install first: pip install 'kokoro>=0.9.4' 'misaki[zh]' soundfile numpy") from e
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg is required to render MP3 files")
    STAGING.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code="z", repo_id=MODEL)
    for i, row in enumerate(rows, 1):
        dst = STAGING / row["filename"]
        if dst.exists() and dst.stat().st_size >= 1200:
            continue
        samples = [np.asarray(audio, dtype=np.float32) for _, _, audio
                   in pipeline(row["text"], voice=row["voice"], speed=1.0)]
        if not samples:
            raise RuntimeError(f"Empty speech output for: {row['text']}")
        audio = np.concatenate(samples)
        if not np.isfinite(audio).all() or len(audio) < 2400:
            raise RuntimeError(f"Invalid speech signal for: {row['text']}")
        with tempfile.TemporaryDirectory() as temp:
            wav = pathlib.Path(temp) / "clip.wav"
            sf.write(str(wav), audio, 24000)
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(wav), "-ac", "1", "-ar", "24000",
                "-codec:a", "libmp3lame", "-qscale:a", "3", str(dst)
            ], check=True)
        if dst.stat().st_size < 1200:
            raise RuntimeError(f"Suspiciously short MP3: {dst.name}")
        print(f"{i:3}/{len(rows)} {row['role']}: {row['text']}")
    save_plan(rows, STAGING / "review-manifest.json")
    print("Staged candidates only. DO NOT deploy before listening and licensing review.")


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--plan", action="store_true", help="Generate review queue; no model required")
    mode.add_argument("--render-samples", action="store_true", help="Generate 6 short test clips in staging")
    mode.add_argument("--render-all", action="store_true", help="Generate all clips in staging only")
    args = parser.parse_args()
    rows = build_queue(load_topics())
    counts = {role: sum(item["role"] == role for item in rows) for role in VOICE_IDS}
    print(f"Approved lesson sources: 7, unique voice/text pairs: {len(rows)}, roles: {counts}")
    if args.plan:
        save_plan(rows, STAGING / "review-manifest.json")
        print("Created local review manifest; no voices generated.")
        return
    if args.render_samples:
        rows = [item for item in rows if (item["role"], item["text"]) in SAMPLE_TEXTS]
        if len(rows) < 4:
            raise RuntimeError("Not enough sample phrases in curriculum")
    synthesize(rows)


if __name__ == "__main__":
    main()
