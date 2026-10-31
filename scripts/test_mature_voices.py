#!/usr/bin/env python3
"""Probe genuinely different adult Mandarin TTS models; keep v71 unchanged."""
import asyncio
import json
import pathlib
import subprocess
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/"assets"/"adult-voice-previews"
VOICES=[
 ("female","zh-CN-XiaoxuanNeural"),
 ("female","zh-CN-XiaoqiuNeural"),
 ("female","zh-CN-XiaomoNeural"),
 ("female","zh-CN-XiaohanNeural"),
 ("male","zh-CN-YunjianNeural"),
 ("male","zh-CN-YunyangNeural"),
]
TEXT="你好！我是中国人。很高兴认识你。"
async def probe(gender,voice):
    path=DEST/(voice+".mp3")
    try:
        await asyncio.wait_for(edge_tts.Communicate(TEXT,voice=voice,rate="-5%").save(str(path)),timeout=36)
        probe=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True)
        duration=float(probe.stdout.strip()) if probe.returncode==0 else 0
        if path.stat().st_size<1800 or duration<0.7:raise ValueError("Invalid/silent MP3")
        print(f"OK {gender} {voice}: {path.stat().st_size} bytes {duration:.2f} sec",flush=True)
        return {"gender":gender,"voice":voice,"ok":True,"size":path.stat().st_size,"duration":round(duration,2)}
    except Exception as e:
        path.unlink(missing_ok=True)
        print(f"UNAVAILABLE {gender} {voice}: {type(e).__name__}: {str(e)[:170]}",flush=True)
        return {"gender":gender,"voice":voice,"ok":False,"error":type(e).__name__}
async def main():
    DEST.mkdir(exist_ok=True,parents=True)
    output=[]
    for batch in [VOICES[:4],VOICES[4:]]:
        output.extend(await asyncio.gather(*(probe(*v) for v in batch)))
        await asyncio.sleep(1)
    (DEST/"results.json").write_text(json.dumps({"text":TEXT,"voices":output,"requirement":"new adult Mandarin female and male MP3s, not pitch-shifted originals"},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RESULT "+json.dumps(output,ensure_ascii=False),flush=True)
if __name__=="__main__":asyncio.run(main())
