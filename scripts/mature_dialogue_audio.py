#!/usr/bin/env python3
"""Lower the timbre of the EXISTING 25 Mandarin clips, without changing speed.
This is not a newly recorded adult actor. Original clips remain in git history.
Personal-use preview; original sound licensing still applies.
"""
import json
import pathlib
import subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
FACTORS={"A":0.91,"B":0.86}
PROFILE="mature-timbre-v71"
def run(*args):
    return subprocess.run(args,capture_output=True,text=True,check=True).stdout.strip()
def main():
    entries=json.loads((ROOT/"assets/dialogue-voice-plan.json").read_text(encoding="utf-8"))["entries"]
    assert len(entries)==25
    status_file=ROOT/"assets/dialogue-voices/status.json"
    status=json.loads(status_file.read_text(encoding="utf-8"))
    if status.get("processing")==PROFILE:
        print("ALREADY PROCESSED");return
    assert status["voices"]=={"A":"zh-CN-XiaoxiaoNeural","B":"zh-CN-YunxiNeural"}
    for entry in entries:
        path=ROOT/entry["file"]
        assert path.exists(),path
        sr=int(run("ffprobe","-v","error","-select_streams","a:0","-show_entries","stream=sample_rate","-of","default=noprint_wrappers=1:nokey=1",str(path)))
        factor=FACTORS[entry["speaker"]]
        dst=path.with_suffix(".mature.mp3")
        try:
            run("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-i",str(path),"-af",f"asetrate={sr}*{factor},aresample={sr},atempo={1/factor:.5f}","-c:a","libmp3lame","-q:a","3",str(dst))
            duration=float(run("ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(dst)))
            assert duration>=.25 and dst.stat().st_size>1800,entry["file"]
            dst.replace(path)
            print("PROCESSED",path.name,"speaker",entry["speaker"],flush=True)
        finally:
            dst.unlink(missing_ok=True)
    status["processing"]=PROFILE
    status["pitch_factors"]=FACTORS
    status["source"]="Original Xiaoxiao/Yunxi MP3s with subtle offline ffmpeg pitch adjustment; not newly recorded; personal evaluation only"
    status_file.write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    packfile=ROOT/"assets/offline-pack.json"
    pack=json.loads(packfile.read_text(encoding="utf-8"))
    pack["version"]=max(pack.get("version",0),71)
    pack["bytes"]=sum((ROOT/p.removeprefix("./")).stat().st_size for p in pack["files"] if (ROOT/p.removeprefix("./")).exists())
    packfile.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("DONE 25 modified audio clips",flush=True)
if __name__=="__main__":
    main()
