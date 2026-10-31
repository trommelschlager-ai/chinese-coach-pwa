#!/usr/bin/env python3
"""190 new Pinyin MP3s with an accessible professional Mandarin narrator, Yunyang.
Personal evaluation only; commercial audio rights require separate verification.
No changes to dialogues, previous v4 recordings or lesson data.
"""
import asyncio,json,pathlib,subprocess,time
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"assets/pinyin-reading-v5"
CURRICULUM=ROOT/"assets/pinyin-reading-curriculum.json"
VOICE="zh-CN-YunyangNeural"
RATE="-3%"
SEM=asyncio.Semaphore(4)
def valid(p):
    if not p.is_file() or p.stat().st_size<1500:return False
    with p.open("rb") as f:h=f.read(3)
    if h!=b"ID3" and not(len(h)>1 and h[0]==255 and (h[1]&0xe0)==0xe0):return False
    v=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(p)],capture_output=True,text=True)
    try:return v.returncode==0 and float(v.stdout.strip())>=.2
    except ValueError:return False
async def make(i,entry):
    dst=DEST/(entry["id"]+".mp3")
    if valid(dst):return
    async with SEM:
        for attempt in range(1,5):
            tmp=dst.with_suffix(".tmp.mp3")
            try:
                await asyncio.wait_for(edge_tts.Communicate(entry["text"],voice=VOICE,rate=RATE).save(str(tmp)),timeout=30)
                if not valid(tmp):raise RuntimeError("empty/corrupt audio")
                tmp.replace(dst)
                if i%10==0:print("OK",entry["id"],flush=True)
                return
            except Exception as e:
                tmp.unlink(missing_ok=True)
                print("RETRY",entry["id"],attempt,type(e).__name__,str(e)[:100],flush=True)
                if attempt==4:raise
                await asyncio.sleep(2*attempt)
async def main():
    clips=json.loads(CURRICULUM.read_text(encoding="utf-8"))["clips"]
    assert len(clips)==190 and len({e["id"] for e in clips})==190
    DEST.mkdir(parents=True,exist_ok=True)
    for i in range(0,len(clips),18):
        await asyncio.gather(*(make(i+j,e) for j,e in enumerate(clips[i:i+18])))
        print("BATCH",min(i+18,190),"/190",flush=True)
    assert all(valid(DEST/(e["id"]+".mp3")) for e in clips)
    (DEST/"status.json").write_text(json.dumps({
        "ready":True,"count":190,"version":75,"voice":VOICE,
        "rate":RATE,"curriculum_version":2,
        "source":"Edge Read Aloud independent Mandarin Yunyang recordings; evaluation only",
        "usage":"Personal preview. Commercial redistribution rights not verified.",
        "created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS 190 new professional Mandarin MP3s",flush=True)
if __name__=="__main__":asyncio.run(main())
