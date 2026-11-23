#!/usr/bin/env python3
"""Stage native Yue Tan audio for exact HSK 1 matches only (review, not release).
Source: hugolpz/audio-cmn 96k/hsk, CC BY-SA 3.0 US. No TTS substitution.
"""
from __future__ import annotations
import json
import pathlib
import subprocess
import urllib.request
from urllib.parse import quote

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"review/hsk1-yue-tan-v163"
AUDIO=OUT/"audio"
SOURCE="hugolpz/audio-cmn"
PREFIX="96k/hsk/cmn-"
BRANCH="master"
IGNORED="。？！!?，,.；;：:、 \t\n\r"

def request(url):
    req=urllib.request.Request(url,headers={"User-Agent":"PandaGoHumanAudioQA/1.0"})
    return urllib.request.urlopen(req,timeout=50)

def source_index():
    with request("https://api.github.com/repos/"+SOURCE+"/git/trees/"+BRANCH+"?recursive=1") as resp:
        obj=json.load(resp)
    if obj.get("truncated"):
        raise RuntimeError("Source tree truncated: missing-word verdicts unreliable")
    found={r["path"] for r in obj["tree"] if r["type"]=="blob" and r["path"].startswith(PREFIX) and r["path"].endswith(".mp3")}
    assert len(found)>3000, "Unexpectedly few source recordings"
    return obj["sha"],found

def normalized(s):
    return s.strip().translate(str.maketrans("","",IGNORED))

def inspect(file):
    if file.stat().st_size<2500:raise RuntimeError(f"Suspicious file size: {file}")
    raw=subprocess.check_output(["ffprobe","-v","error","-select_streams","a:0",
      "-show_entries","stream=codec_name:format=duration","-of","json",str(file)],text=True)
    info=json.loads(raw)
    d=float(info["format"]["duration"])
    assert info["streams"][0]["codec_name"]=="mp3" and 0.25<d<18,(file,d)
    return round(d,2)

def main():
    AUDIO.mkdir(parents=True,exist_ok=True)
    old=json.loads((ROOT/"assets/hsk1-voices-v160/manifest.json").read_text())
    rows=old["files"]
    assert len(rows)==123
    targets=rows+[{"text":"日","pinyin_reference":"rì","file":"native-ri.mp3"}]
    sha,available=source_index()
    report=[]
    for i,item in enumerate(targets,1):
        hanzi=item["text"]
        key=normalized(hanzi)
        sourcepath=PREFIX+key+".mp3"
        matched=sourcepath in available
        line={"text":hanzi,"pinyin":item.get("pinyin_reference"),
              "found_exact_hanzi":matched,
              "review_status":"NOT_YET_LISTENED" if matched else "MISSING_HUMAN_AUDIO"}
        if matched:
            name=f"{i:03d}_{item['file']}"
            url=f"https://raw.githubusercontent.com/{SOURCE}/{BRANCH}/{quote(sourcepath,safe='/')}"
            target=AUDIO/name
            with request(url) as resp:
                if resp.status!=200:raise RuntimeError(f"Download error: {url}")
                target.write_bytes(resp.read(600000))
            line["duration_seconds"]=inspect(target)
            line["local_file"]=str(target.relative_to(OUT))
            line["source_path"]=sourcepath
        report.append(line)
        print(f"{i:03d} {'MATCH' if matched else 'MISS '} {hanzi}",flush=True)

    present=sum(1 for x in report if x["found_exact_hanzi"])
    summary={
      "status":"REVIEW_ONLY_NOT_PRODUCTION",
      "speaker":"Yue Tan (Shtooka cmn-caen-tan)",
      "original_author":"Yue Tan, 2009",
      "conversion_author":"Hugo Lopez (audio-cmn)",
      "license":"CC BY-SA 3.0 US",
      "license_url":"https://creativecommons.org/licenses/by-sa/3.0/us/",
      "source_url":f"https://github.com/{SOURCE}",
      "source_tree":sha,"target_count":len(targets),
      "match_count":present,"missing_count":len(targets)-present,
      "native_ri_already_active":True,
      "native_tone_listener_audit_complete":False,
      "live_course_unchanged":True,
      "items":report
    }
    OUT.joinpath("coverage.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
    missing=[x["text"] for x in report if not x["found_exact_hanzi"]]
    OUT.joinpath("README.md").write_text(
      "# Panda Go HSK1 – Yue Tan human voice coverage\n\n"
      f"Matched {present} / {len(targets)} exact Chinese texts. Missing {len(missing)}.\n\n"
      "All recordings are real Mandarin words from Yue Tan's Shtooka archive. "
      "Do NOT infer coverage of complete dialogues. Orthographic and codec "
      "matching is not a native phonetic/tones audit.\n\n"
      "Yue Tan / Shtooka, CC BY-SA 3.0 US. Hugo Lopez audio-cmn re-encoded "
      "MP3 versions. Attribution, license link, indication of changes and "
      "share-alike for adaptations are required. No synthetic fallback.\n\n"
      "## Missing words and sentences\n\n"+
      "\n".join("- "+x for x in missing)+"\n",
      encoding="utf-8")
    print(f"SUMMARY: human audio {present}/{len(targets)}, missing {len(missing)}",flush=True)

if __name__=="__main__":
    main()
