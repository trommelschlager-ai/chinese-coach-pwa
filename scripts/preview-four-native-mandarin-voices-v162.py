#!/usr/bin/env python3
"""Four short Mandarin-voice previews for choosing, not for commercial publication.

Use Microsoft Mandarin voices through the community edge-tts preview client for
informal personal evaluation only. Production must have properly licensed Azure
Speech access and Mandarin-native phonetic QA.
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
import subprocess
import tempfile

import edge_tts
from pydub import AudioSegment

OUT=Path("assets/mandarin-choice-samples-v162")
RATE="-18%"
# Four genuinely different Mandarin Chinese female neural voices, not Kokoro/MeloTTS.
VOICES=[
    ("01", "zh-CN-XiaohanNeural", "Сяохань"),
    ("02", "zh-CN-XiaoqiuNeural", "Сяоцю"),
    ("03", "zh-CN-XiaomoNeural", "Сяомо"),
    ("04", "zh-CN-XiaorouNeural", "Сяожоу"),
]
MAMA="妈妈。"               # māma: inspect neutral second syllable, avoid 'mamai'
REST="你好。汉字。拼音。日。我喜欢学习中文。"
NOTES=["妈妈 māma","你好 nǐ hǎo","汉字 hànzì","拼音 pīnyīn",
       "日 rì","我喜欢学习中文 Wǒ xǐhuan xuéxí Zhōngwén"]

def audio_probe(path:Path):
    raw=subprocess.check_output(
      ["ffprobe","-v","error","-select_streams","a:0",
       "-show_entries","stream=codec_name,channels:format=duration",
       "-of","json",str(path)],text=True)
    meta=json.loads(raw);secs=float(meta["format"]["duration"])
    assert meta["streams"][0]["codec_name"]=="mp3"
    assert 0.2<secs<35, (path,secs)
    assert path.stat().st_size>2000
    return round(secs,2)

async def make(text,voice,dest):
    # The TTS engine itself alters speaking rate (not posthoc time stretching).
    await edge_tts.Communicate(text, voice, rate=RATE).save(str(dest))

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    rows=[]
    for code,voice,display in VOICES:
        print(f"Starting {display} / {voice}",flush=True)
        with tempfile.TemporaryDirectory() as td:
            t=Path(td)
            mama=t/"mama.mp3";rest=t/"rest.mp3"
            await make(MAMA,voice,mama)
            await make(REST,voice,rest)
            first=AudioSegment.from_file(mama).set_frame_rate(24000).set_channels(1)
            second=AudioSegment.from_file(rest).set_frame_rate(24000).set_channels(1)
            if first.dBFS < -55 or second.dBFS < -55:
                raise RuntimeError("Empty/quiet sample")
            # First word is separately audible; one gentle pause before the rest.
            full=first+AudioSegment.silent(duration=700,frame_rate=24000)+second
            combined=OUT/f"{code}_{voice}_sample.mp3"
            full.export(combined,format="mp3",codec="libmp3lame",bitrate="96k")
            isolated=OUT/f"{code}_{voice}_mama.mp3"
            first.export(isolated,format="mp3",codec="libmp3lame",bitrate="96k")
        d=audio_probe(combined);audio_probe(isolated)
        rows.append({"number":int(code),"display_name":display,"voice_id":voice,
                     "synthesized_rate":RATE,"duration_seconds":d,
                     "sample_file":combined.name,"mama_file":isolated.name,
                     "pronunciation_review":"not yet audited by native Mandarin speaker"})
        print(f"SUCCESS {display}: {d}s",flush=True)
    (OUT/"manifest.json").write_text(json.dumps({
      "status":"CHOICE_PREVIEWS_NOT_LICENCED_FOR_PAID_COURSE",
      "source":"Microsoft Chinese Neural voices through edge-tts client",
      "license_warning":"Personal evaluation only; commercial deployment needs authorized Azure Speech license.",
      "rate":RATE,"phrases":NOTES,"voices":rows
    },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (OUT/"README.md").write_text(
      "# Four Chinese female voice choices — preview only\n\n"
      "Each MP3 starts with 妈妈 (māma), then 你好, 汉字, 拼音, 日, 我喜欢学习中文。\n"
      "Rate adjusted in the speech service: -18%. Not postprocessed by playbackRate.\n\n"
      "**Preview-only:** no legal right to publish these unlicensed preview recordings "
      "as paid-course assets is asserted. If selected, obtain the appropriate Azure "
      "Speech commercial license before Panda Go integration.\n\n"
      "Chinese tones and neutral-tone pronunciation are not independently verified.\n",
      encoding="utf8")

if __name__=="__main__":
    asyncio.run(main())
