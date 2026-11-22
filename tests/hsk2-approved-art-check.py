#!/usr/bin/env python3
"""Check approved HSK2 cover files before release to GitHub Pages."""
import json, hashlib, pathlib, struct, sys
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/"assets/hsk2-approved-covers/manifest.json").read_text(encoding="utf-8"))
bad=[]
for item in manifest:
 p=root/item["path"]
 t=root/item["tail"]
 if not p.is_file():bad.append("missing image "+str(p));continue
 b=p.read_bytes()
 if not b.startswith(b"\x89PNG\r\n\x1a\n"):bad.append("not PNG "+str(p));continue
 w,h=struct.unpack(">II",b[16:24])
 if (w,h)!=(941,1672):bad.append(f"wrong image size: {p}, {w}x{h}")
 if hashlib.sha256(b).hexdigest()!=item["sha256"]:bad.append("image SHA mismatch "+str(p))
 if not t.is_file() or t.stat().st_size<1000:bad.append("missing/empty continuation "+str(t))
pages=[
"hsk2-about-me.html","hsk2-lesson1.html","hsk2-lesson3-work-study-preview.html",
"hsk2-lesson4-hobby-preview.html","hsk2-lesson5-friends-v2.html",
"hsk2-lesson6-yesterday-preview.html","hsk2-lesson7-future-preview.html",
"hsk2-lesson8-shop-preview.html","hsk2-lesson9-health-preview.html",
"hsk2-lesson10-relationships-preview.html"]
for i,p in enumerate(pages,1):
 txt=(root/p).read_text(encoding="utf-8")
 if f'data-lesson="{i}"' not in txt or 'hsk2-approved-cover.css' not in txt:
  bad.append("lesson not linked: "+p)
print(f"HSK2 approved artwork: {len(manifest)} originals, 10 linked lessons")
for error in bad:print("FAIL:",error,file=sys.stderr)
if bad:sys.exit(1)
print("SUCCESS: 10 PNGs, 10 decorative tails, 10 pages, hashes and dimensions correct")
