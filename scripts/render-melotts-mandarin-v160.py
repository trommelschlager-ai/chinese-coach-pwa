#!/usr/bin/env python3
"""Panda Go HSK 1: synthesize 123 Mandarin lesson phrases using independent MeloTTS.

The user rejected repeated Kokoro female Mandarin distortions ("妈妈" as "mamai").
Use Chinese-native MeloTTS language ZH (MIT), not another Kokoro timbre.
Male dialogue and the original human native 日 remain untouched.
Never publish files without full QA and an auditable speaker/phrase map.
"""
from __future__ import annotations
import argparse
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
INPUT=ROOT/"assets/hsk1-voices-v159/manifest.json"
DEST=ROOT/"assets/hsk1-voices-v160"
VOICE="MeloTTS-ZH"
MODEL="myshell-ai/MeloTTS"
LICENSE="MIT"

def queue():
    source=json.loads(INPUT.read_text(encoding="utf8"))
    rows=source.get("files",[])
    assert len(rows)==123, f"Expected 123 female utterances, got {len(rows)}"
    assert all(row.get("text")!="日" for row in rows), "Native 日 must not be replaced"
    assert len({r["file"] for r in rows})==len(rows)
    assert len({r["text"] for r in rows})==len(rows)
    for text in ("妈妈","拼音","汉字","你好！","声调"):
        assert any(row["text"]==text for row in rows), f"Missing essential pronunciation test: {text}"
    return rows

def inspect(file):
    if not file.is_file() or file.stat().st_size < 1500:
        raise RuntimeError(f"Missing or suspicious MP3: {file}")
    raw=subprocess.check_output(["ffprobe","-v","error","-select_streams","a:0",
      "-show_entries","format=duration:stream=codec_name,channels,sample_rate",
      "-of","json",str(file)],text=True)
    info=json.loads(raw)
    stream=info["streams"][0]
    duration=float(info["format"]["duration"])
    if stream["codec_name"]!="mp3" or int(stream["channels"])!=1 or not (0.2<duration<20):
        raise RuntimeError(f"Invalid Chinese audio ({file}): {info}")
    return round(duration,3)

def render(rows):
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe required")
    from melo.api import TTS
    model=TTS(language="ZH",device="cpu")
    speaker=model.hps.data.spk2id["ZH"]
    DEST.mkdir(parents=True,exist_ok=True)
    for i,row in enumerate(rows,1):
        mp3=DEST/row["file"]
        if mp3.exists() and mp3.stat().st_size > 1500:
            inspect(mp3)
            continue
        with tempfile.TemporaryDirectory() as td:
            wav=pathlib.Path(td)/"voice.wav"
            model.tts_to_file(row["text"],speaker,str(wav),speed=1.0)
            subprocess.run(["ffmpeg","-y","-hide_banner","-loglevel","error",
              "-i",str(wav),"-ac","1","-ar","24000","-codec:a","libmp3lame",
              "-qscale:a","3",str(mp3)],check=True)
        dur=inspect(mp3)
        print(f"{i:03}/{len(rows)} Chinese voice: {row['text']} [{dur:.2f}s]",flush=True)

def verify(rows):
    durations={r["file"]:inspect(DEST/r["file"]) for r in rows}
    if len(durations)!=123:raise RuntimeError("Incomplete Chinese audio")
    flagged=[]
    for row in rows:
        t=row["text"];d=durations[row["file"]]
        # Review flags only; duration is not an actual Mandarin tone check.
        if len(t)<=2 and d>2.5:
            flagged.append({"text":t,"duration":d,"reason":"overlong short expression"})
    metadata={
      "status":"NEW_MANDARIN_ENGINE__USER_PHONETIC_REVIEW_REQUIRED",
      "engine":MODEL,"voice":VOICE,"license":LICENSE,
      "generation_speed":1.0,"total_files":len(rows),
      "preserve_male_kokoro":True,
      "preserve_native_ri":True,
      "all_utterance_tones_verified":False,
      "pronunciation_flags":flagged,
      "files":[{"text":r["text"],"pinyin_reference":r.get("pinyin_reference"),
       "file":r["file"],"duration_seconds":durations[r["file"]],
       "pronunciation_review":"pending_Mandarin_listener_approval"} for r in rows]
    }
    DEST.joinpath("manifest.json").write_text(
        json.dumps(metadata,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Verified {len(rows)} new MeloTTS ZH clips. Short-word duration flags: {len(flagged)}",flush=True)
    if flagged:print(json.dumps(flagged,ensure_ascii=False),flush=True)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--render",action="store_true")
    p.add_argument("--verify",action="store_true")
    args=p.parse_args()
    if not(args.render or args.verify):p.error("Choose --render or --verify")
    rows=queue()
    if args.render:render(rows)
    verify(rows)

if __name__=="__main__":main()
