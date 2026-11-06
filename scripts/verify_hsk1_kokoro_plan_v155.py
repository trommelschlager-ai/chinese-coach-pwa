#!/usr/bin/env python3
"""No-download safety QA for HSK 1 voice production queue."""
import importlib.util
import json
import pathlib
import subprocess
import sys

root=pathlib.Path(__file__).resolve().parents[1]
script=root/"scripts/hsk1_kokoro_audio_v155.py"
subprocess.run([sys.executable,str(script),"--plan"],cwd=root,check=True)
plan=json.loads((root/".voice-staging/hsk1-kokoro-v155/review-manifest.json").read_text(encoding="utf-8"))
rows=plan["sentences"]
assert plan["status"]=="CANDIDATES_ONLY_NOT_APPROVED_FOR_RELEASE"
assert plan["model_license"]=="Apache-2.0"
assert plan["voices"]=={"female":"zf_xiaoxiao","male":"zm_yunjian"}
assert rows and all(r["text"] and r["review"]=="pending_native_tone_check" for r in rows)
assert len({(r["role"],r["text"]) for r in rows})==len(rows)
assert len({r["filename"] for r in rows})==len(rows)
assert {"female","male"} == {r["role"] for r in rows}
assert any(r["role"]=="female" and r["text"]=="我" for r in rows)
assert any(r["role"]=="male" and r["text"]=="你好！" for r in rows)
assert any(r["role"]=="female" and r["text"]=="你好！" for r in rows)
assert any("weather.dialogue" in " ".join(r["origins"]) for r in rows)
print("HSK 1 v155: licensed model attribution, female/male role map, exact text and non-published review status OK")
