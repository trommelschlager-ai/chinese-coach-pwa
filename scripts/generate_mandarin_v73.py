#!/usr/bin/env python3
"""New A-Z Mandarin pinyin clips and corrected dialogue speaker identities.
Personal evaluation audio; commercial redistribution rights are NOT granted.
"""
import asyncio
import json
import pathlib
import subprocess
import time
import edge_tts

ROOT=pathlib.Path(__file__).resolve().parents[1]
PIN=ROOT/"assets/pinyin-reading-curriculum.json"
DIALOG=ROOT/"assets/dialogue-voice-plan.json"
PIN_DIR=ROOT/"assets/pinyin-reading-v3"
DIALOG_DIR=ROOT/"assets/dialogue-voices-v73"
PIN_VOICE="zh-CN-YunjianNeural"  # deeper, mature-sounding male voice
WOMAN="zh-CN-XiaoxuanNeural"
MAN="zh-CN-YunjianNeural"
sem=asyncio.Semaphore(3)

def valid(path):
    if not path.is_file() or path.stat().st_size<1500:return False
    with path.open("rb") as f:head=f.read(3)
    if head!=b"ID3" and not (len(head)>=2 and head[0]==255 and (head[1]&0xe0)==0xe0):return False
    run=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True)
    try:return run.returncode==0 and float(run.stdout.strip())>=.18
    except ValueError:return False

async def clip(path,text,voice):
    if valid(path):return
    async with sem:
        for attempt in range(1,6):
            temp=path.with_suffix(".temp.mp3")
            try:
                await asyncio.wait_for(edge_tts.Communicate(text,voice=voice,rate="-5%").save(str(temp)),timeout=35)
                if not valid(temp):raise RuntimeError("Invalid or empty MP3")
                temp.replace(path)
                print("OK",path.name,text,voice,flush=True)
                return
            except Exception as err:
                temp.unlink(missing_ok=True)
                print("RETRY",path.name,attempt,type(err).__name__,str(err)[:90],flush=True)
                if attempt==5:raise
                await asyncio.sleep(2*attempt)
            await asyncio.sleep(.18)

async def batch(items,size=18):
    for i in range(0,len(items),size):
        await asyncio.gather(*items[i:i+size])
        print("BATCH",min(i+size,len(items)),"/",len(items),flush=True)

async def main():
    curr=json.loads(PIN.read_text(encoding="utf-8"))
    lines=curr["clips"]
    assert len(lines)==190 and len({x["id"] for x in lines})==190
    PIN_DIR.mkdir(parents=True,exist_ok=True)
    ds=json.loads(DIALOG.read_text(encoding="utf-8"))["entries"]
    assert len(ds)==25
    DIALOG_DIR.mkdir(parents=True,exist_ok=True)
    print("RECORD PINYIN",len(lines),"VOICE",PIN_VOICE,flush=True)
    await batch([clip(PIN_DIR/(x["id"]+".mp3"),x["text"],PIN_VOICE) for x in lines])
    assert all(valid(PIN_DIR/(x["id"]+".mp3")) for x in lines)
    (PIN_DIR/"status.json").write_text(json.dumps({
        "ready":True,"count":190,"voice":PIN_VOICE,"curriculum_version":2,"version":73,
        "rate":"-5%","usage":"Personal preview only. Commercial redistribution requires a valid license.",
        "created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RECORD DIALOGUE",len(ds),"VOICE A FEMALE EXCEPT LESSON2",flush=True)
    def role(e):
        if int(e["lesson"])==2:return "male" if e["speaker"]=="A" else "female"
        return "female" if e["speaker"]=="A" else "male"
    jobs=[]
    for e in ds:
        voice=WOMAN if role(e)=="female" else MAN
        jobs.append(clip(DIALOG_DIR/pathlib.Path(e["file"]).name,e["text"],voice))
    await batch(jobs,10)
    assert all(valid(DIALOG_DIR/pathlib.Path(e["file"]).name) for e in ds)
    (DIALOG_DIR/"status.json").write_text(json.dumps({
       "ready":True,"version":73,"count":25,
       "voices":{"A":WOMAN,"B":MAN},
       "role_override":{"lesson":2,"A":"male","B":"female"},
       "source":"edge-tts new personal-preview MP3s; not licensed for commercial redistribution",
       "created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("ALL 190 PINYIN + 25 CORRECTED DIALOGUE MP3 VALIDATED",flush=True)

if __name__=="__main__":
    asyncio.run(main())
