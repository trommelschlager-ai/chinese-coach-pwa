#!/usr/bin/env python3
"""Generate verified natural Mandarin preview MP3 for the 13 basic vocabulary topics.
Preview only: Microsoft Edge Read Aloud recording rights are not granted for paid redistribution.
"""
import asyncio
import json
from pathlib import Path
import subprocess
import sys
import time
import edge_tts

ROOT=Path(__file__).resolve().parents[1]
PLAN=ROOT/"assets/basic-words-audio-plan.json"
DIR=ROOT/"assets/basic-words-audio"
VOICE="zh-CN-XiaoyiNeural"

def valid(path):
    if not path.exists() or path.stat().st_size<1600: return False
    with path.open("rb") as f: magic=f.read(3)
    if magic!=b"ID3" and not (len(magic)>=2 and magic[0]==255 and (magic[1]&0xe0)==0xe0):return False
    check=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True)
    try:return check.returncode==0 and float(check.stdout.strip())>=.20
    except ValueError:return False

async def one(item):
    path=ROOT/item["file"]
    assert path.parent==DIR and path.name==item["id"]+".mp3"
    if valid(path):
        print("REUSE",item["id"],flush=True)
        return
    for n in range(1,5):
        temp=path.with_suffix(".tmp.mp3")
        try:
            await edge_tts.Communicate(item["hz"],voice=VOICE,rate="-14%").save(str(temp))
            if not valid(temp):raise RuntimeError("Invalid MP3")
            temp.replace(path)
            print("OK",item["id"],item["hz"],flush=True)
            return
        except Exception as e:
            temp.unlink(missing_ok=True)
            print("RETRY",item["id"],n,repr(e),file=sys.stderr,flush=True)
            if n==4:raise
            await asyncio.sleep(2*n)

async def main():
    content=json.loads(PLAN.read_text(encoding="utf-8"))
    items=content["items"]
    assert content["voice"]==VOICE and len(items)>=100
    assert len({x["hz"] for x in items})==len(items)
    DIR.mkdir(parents=True,exist_ok=True)
    for item in items:
        await one(item)
        await asyncio.sleep(.15)
    assert all(valid(ROOT/i["file"]) for i in items)
    (DIR/"status.json").write_text(json.dumps({"ready":True,"count":len(items),"voice":VOICE,"version":content["version"],"license":"Preview evaluation only","generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("COMPLETE",len(items),"verified files",flush=True)

if __name__=="__main__":asyncio.run(main())
