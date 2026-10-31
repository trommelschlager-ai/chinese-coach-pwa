#!/usr/bin/env python3
"""Generate all 25 new adult-sounding Mandarin dialogue MP3 previews.
Original Xiaoxiao/Yunxi recordings are never modified.
Evaluation only: Microsoft Edge voices need separate commercial licensing.
"""
from __future__ import annotations
import asyncio
import json
import pathlib
import subprocess
import time
import edge_tts

ROOT=pathlib.Path(__file__).resolve().parents[1]
PLAN=ROOT/"assets/dialogue-voice-plan.json"
OUTPUT=ROOT/"assets/dialogue-voices-v72"
VOICES={"A":"zh-CN-XiaoxuanNeural","B":"zh-CN-YunjianNeural"}
RATE="-5%"

def validate(path:pathlib.Path)->bool:
    if not path.exists() or path.stat().st_size<1800:return False
    with path.open("rb") as f:header=f.read(3)
    if header!=b"ID3" and not (header[0]==255 and (header[1]&0xE0)==0xE0):return False
    proc=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                        "-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True)
    try:return proc.returncode==0 and float(proc.stdout.strip())>=.4
    except ValueError:return False

async def make_clip(entry):
    speaker=entry["speaker"];voice=VOICES[speaker]
    path=OUTPUT/pathlib.Path(entry["file"]).name
    if validate(path):print(f"KEEP {path.name} {voice}",flush=True);return path
    tmp=path.with_suffix(".tmp.mp3")
    for retry in range(3):
        try:
            await asyncio.wait_for(edge_tts.Communicate(entry["text"],voice=voice,rate=RATE).save(str(tmp)),timeout=30)
            if not validate(tmp):raise RuntimeError("silent, invalid or truncated MP3")
            tmp.replace(path)
            print(f"NEW {path.name} {voice} {path.stat().st_size} bytes",flush=True)
            return path
        except Exception as err:
            tmp.unlink(missing_ok=True)
            print(f"RETRY {retry+1}/3 {path.name} {type(err).__name__}: {str(err)[:150]}",flush=True)
            if retry==2:raise
            await asyncio.sleep(2+retry*3)

async def main():
    entries=json.loads(PLAN.read_text(encoding="utf-8"))["entries"]
    assert len(entries)==25 and sum(e["speaker"]=="A" for e in entries)==13
    OUTPUT.mkdir(parents=True,exist_ok=True)
    paths=[]
    for entry in entries:
        paths.append(await make_clip(entry))
        await asyncio.sleep(.25)
    if len(set(paths))!=25 or not all(map(validate,paths)):raise RuntimeError("Full 25-file pack must be valid")
    status={"ready":True,"version":72,"count":25,"voices":VOICES,"rate":RATE,
            "source":"edge-tts Microsoft Read Aloud (new MP3s, personal evaluation only; no commercial redistribution grant)",
            "generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
    (OUTPUT/"status.json").write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SUCCESS: all 25 MP3s generated with NEW female and male voice IDs",flush=True)
if __name__=="__main__":
    asyncio.run(main())
