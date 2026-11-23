#!/usr/bin/env python3
"""Replace ALL 190 Mandarin pinyin preview recordings with softer Xiaoxuan voice.
Personal evaluation only; commercial licensing must be obtained separately.
Does not modify dialogue audio.
"""
import asyncio
import json
import pathlib
import subprocess
import time
import edge_tts

ROOT=pathlib.Path(__file__).resolve().parents[1]
CURR=ROOT/"assets/pinyin-reading-curriculum.json"
OUT=ROOT/"assets/pinyin-reading-v4"
VOICE="zh-CN-XiaoxuanNeural"
SPEED="-5%"
sem=asyncio.Semaphore(3)

def good(path):
    if not path.is_file() or path.stat().st_size<1500:return False
    with path.open("rb") as f:header=f.read(3)
    if header!=b"ID3" and not (len(header)>=2 and header[0]==255 and header[1]&224==224):return False
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True)
    try:return p.returncode==0 and float(p.stdout.strip())>=.18
    except ValueError:return False

async def record(item):
    path=OUT/(item["id"]+".mp3")
    if good(path):return
    async with sem:
        for retry in range(5):
            temp=path.with_suffix(".partial.mp3")
            try:
                await asyncio.wait_for(edge_tts.Communicate(item["text"],voice=VOICE,rate=SPEED).save(str(temp)),timeout=35)
                if not good(temp):raise RuntimeError("Invalid or silent clip")
                temp.replace(path)
                print(f"OK {path.name} {item['text']} {path.stat().st_size}",flush=True)
                return
            except Exception as e:
                temp.unlink(missing_ok=True)
                print(f"RETRY {retry+1} {path.name} {type(e).__name__}: {str(e)[:100]}",flush=True)
                if retry==4:raise
                await asyncio.sleep(2*(retry+1))

async def main():
    clips=json.loads(CURR.read_text(encoding="utf-8"))["clips"]
    assert len(clips)==190 and len(set(c["id"] for c in clips))==190
    OUT.mkdir(parents=True,exist_ok=True)
    for pos in range(0,len(clips),18):
        await asyncio.gather(*(record(c) for c in clips[pos:pos+18]))
        print(f"BATCH {min(pos+18,190)}/190",flush=True)
        await asyncio.sleep(.25)
    assert all(good(OUT/(c["id"]+".mp3")) for c in clips)
    info={"ready":True,"count":190,"voice":VOICE,"curriculum_version":2,"version":74,
          "rate":SPEED,"usage":"Personal preview only; commercial redistribution requires a valid TTS license.",
          "created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
    (OUT/"status.json").write_text(json.dumps(info,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SUCCESS: all 190 soft Xiaoxuan pinyin samples verified.",flush=True)

if __name__=="__main__":
    asyncio.run(main())
