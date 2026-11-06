#!/usr/bin/env python3
"""Stage actual licensed Yue Tan files for standalone Panda Go audio review.

No existing production HTML, audio map, lessons, or user progress are altered.
Original MP3 bytes are copied intact from the separate human-audio audit branch.
"""
from __future__ import annotations
import json,pathlib,shutil,subprocess

ROOT=pathlib.Path(__file__).resolve().parents[1]
LIST=ROOT/"assets/yue-tan-human-v166.json"
SRC=ROOT/"review/hsk1-yue-tan-v163/audio"
OUT=ROOT/"assets/yue-tan-human-v166"

def probe(p):
    if not p.is_file() or p.stat().st_size<2500:
        raise RuntimeError(f"Missing or too small MP3: {p}")
    raw=subprocess.check_output([
        "ffprobe","-v","error","-select_streams","a:0",
        "-show_entries","stream=codec_name:format=duration",
        "-of","json",str(p)],text=True)
    info=json.loads(raw)
    seconds=float(info["format"]["duration"])
    assert info["streams"][0]["codec_name"]=="mp3" and 0.25<seconds<20,(p,info)
    return round(seconds,2)

def main():
    catalog=json.loads(LIST.read_text(encoding="utf8"))
    assert catalog["status"]=="HUMAN_NATIVE_VOICE_LISTENING_REVIEW_ONLY"
    rows=catalog["items"]
    assert len(rows)==59
    assert len(set(x["hanzi"] for x in rows))==59
    OUT.mkdir(parents=True,exist_ok=True)
    n=0
    for row in rows:
        path=row["path"]
        if row["hanzi"]=="日":
            assert path=="./assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3"
            assert abs(probe(ROOT/path)-row["duration_seconds"])<0.35
            continue
        assert path.startswith("./assets/yue-tan-human-v166/")
        name=path.rsplit("/",1)[-1]
        assert name.endswith(".mp3") and "/" not in name
        original=SRC/name
        dest=OUT/name
        if original.is_file():
            if not dest.exists():shutil.copyfile(original,dest)
            assert dest.read_bytes()==original.read_bytes(), f"Different original human audio: {name}"
        d=probe(dest)
        assert abs(d-row["duration_seconds"])<0.35,(row["hanzi"],d,row["duration_seconds"])
        n+=1
    assert n==58
    assert len(list(OUT.glob("*.mp3")))==58
    page=ROOT/"yue-tan-listening.html"
    assert page.is_file() and "HUMAN_NATIVE_VOICE_LISTENING_REVIEW_ONLY" in page.read_text(encoding="utf8")
    print("PASS: 58 real Yue Tan MP3 files + previously licensed human 日; 59 review words; unchanged main lessons.")

if __name__=="__main__":main()
