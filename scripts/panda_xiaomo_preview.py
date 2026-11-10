#!/usr/bin/env python3
"""Review-only Xiaomo Mandarin clips. Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.

No live lesson files are modified. Check tones and commercial permissions before use.
"""
import argparse, json, os, pathlib, re, sys
import urllib.error, urllib.request
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

VOICE = "zh-CN-XiaomoNeural"
ITEMS = [
    ("01-ma1", "妈", "mā", "first tone"),
    ("02-ma2", "麻", "má", "second tone"),
    ("03-ma3", "马", "mǎ", "third tone"),
    ("04-ma4", "骂", "mà", "fourth tone"),
    ("05-zi4", "字", "zì", "z vs c"),
    ("06-ci2", "词", "cí", "aspirated c"),
    ("07-zhi1", "知", "zhī", "retroflex zh"),
    ("08-chi1", "吃", "chī", "retroflex ch"),
    ("09-shi4", "是", "shì", "retroflex sh"),
    ("10-qi1", "七", "qī", "q vs ch"),
    ("11-nv3", "女", "nǚ", "vowel ü"),
    ("12-nihao", "你好", "nǐ hǎo → ní hǎo", "3+3 tone sandhi"),
    ("13-bushi", "不是", "bù shì → bú shì", "不 before 4th tone"),
    ("14-yige", "一个", "yī gè → yí ge", "一 tone sandhi; neutral 个"),
    ("15-bai2", "白", "bái", "previously missing bái"),
]
def ssml(text):
    value = ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
             'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">'
             '<voice name="zh-CN-XiaomoNeural">'
             '<mstts:express-as style="calm" role="OlderAdultFemale">'
             '<prosody rate="-15%">' + escape(text) +
             '。</prosody></mstts:express-as></voice></speak>')
    ET.fromstring(value)
    return value.encode("utf-8")
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--out", default="xiaomo-review-only")
    args = parser.parse_args()
    manifest = {
       "status": "review_only_not_approved_for_publishing",
       "voice": VOICE, "style": "calm", "role": "OlderAdultFemale",
       "rate": "-15%", "pitch_change": "none",
       "clips": [{"file": name + ".mp3", "hanzi": hanzi,
                  "pinyin": pinyin, "check": check}
                 for name, hanzi, pinyin, check in ITEMS]
    }
    for _, hanzi, _, _ in ITEMS: ssml(hanzi)
    if args.dry_run:
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
        return
    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        sys.exit("Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION")
    if not re.fullmatch(r"[a-z0-9-]+", region):
        sys.exit("Invalid Azure region")
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    endpoint = "https://" + region + ".tts.speech.microsoft.com/cognitiveservices/v1"
    for name, hanzi, _, _ in ITEMS:
        req = urllib.request.Request(endpoint, data=ssml(hanzi), method="POST",
             headers={"Ocp-Apim-Subscription-Key": key,
                      "Content-Type": "application/ssml+xml",
                      "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
                      "User-Agent": "PandaGo-Voice-Review"})
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                data = response.read()
        except urllib.error.HTTPError as ex:
            sys.exit("Azure speech error for " + name + ": HTTP " + str(ex.code))
        if len(data) < 1000 or not (data.startswith(b"ID3") or data[:2] in
                                      (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
            sys.exit("Invalid MP3 returned for " + name)
        (out / (name + ".mp3")).write_bytes(data)
        print("Saved " + name + ".mp3")
    (out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Human Mandarin tone QA required before any app rollout.")
if __name__ == "__main__":
    main()
