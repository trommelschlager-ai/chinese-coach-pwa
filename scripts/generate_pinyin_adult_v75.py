#!/usr/bin/env python3
"""Generate genuinely different adult-sounding Mandarin pinyin example recordings.
Personal evaluation only; separate commercial audio rights are required.
Keep prior v4 recordings and all dialogues untouched.
"""
import asyncio, json, pathlib, subprocess, time
import edge_tts

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"assets/pinyin-voices-v75"
CURRICULUM=ROOT/"assets/pinyin-reading-curriculum.json"
VOICES={
  "xiaomo":"zh-CN-XiaomoNeural",
  "yunyang":"zh-CN-YunyangNeural",
}
RATE="-2%"
SEM=asyncio.Semaphore(4)

def valid(p):
    if not p.exists() or p.stat().st_size<1600:return False
    with p.open("rb") as f:head=f.read(3)
    if head!=b"ID3" and not (len(head)>=2 and head[0]==255 and (head[1]&0xe0)==0xe0):return False
    a=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(p)],capture_output=True,text=True)
    try:return a.returncode==0 and float(a.stdout.strip())>=.2
    except ValueError:return False

async def clip(i,voice_name,voice,item):
    dst=DEST/voice_name/(item["id"]+".mp3")
    if valid(dst):return
    async with SEM:
      for attempt in range(5):
        temp=dst.with_suffix(".tmp.mp3")
        try:
            await asyncio.wait_for(edge_tts.Communicate(item["text"],voice=voice,rate=RATE).save(str(temp)),timeout=45)
            if not valid(temp):raise RuntimeError("invalid MP3")
            temp.replace(dst)
            if i%10==0:print("OK",voice_name,i,item["id"],flush=True)
            return
        except Exception as e:
            temp.unlink(missing_ok=True)
            print("RETRY",voice_name,item["id"],attempt+1,type(e).__name__,str(e)[:120],flush=True)
            if attempt==4:raise
            await asyncio.sleep(2+attempt*2)

async def main():
    items=json.loads(CURRICULUM.read_text(encoding="utf-8"))["clips"]
    assert len(items)==190 and len({v["id"] for v in items})==190
    for name,voice in VOICES.items():
       folder=DEST/name;folder.mkdir(parents=True,exist_ok=True)
       print("GENERATE",name,voice,flush=True)
       for offset in range(0,len(items),20):
          await asyncio.gather(*(clip(offset+j,name,voice,item) for j,item in enumerate(items[offset:offset+20])))
          print("BATCH",name,min(offset+20,len(items)),"/190",flush=True)
       assert all(valid(folder/(entry["id"]+".mp3")) for entry in items)
    status={
      "ready":True,"version":75,"count_per_voice":190,"rate":RATE,
      "voices":VOICES,"default":"xiaomo",
      "source":"Edge Read Aloud preview recordings, new MP3s (not pitch-shifted)",
      "usage":"Evaluation only; verify license before paid commercial use",
      "created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    }
    (DEST/"status.json").write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: 380 independently generated/validated MP3 files",flush=True)

if __name__=="__main__":
    asyncio.run(main())
