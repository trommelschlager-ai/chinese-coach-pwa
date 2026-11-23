#!/usr/bin/env python3
"""Panda Street AI: offline source-pixel layer extraction (unapproved artwork).

This deliberately DOES NOT invent sleeve/fur that is hidden by the fist, animate
the artwork, replace the approved character, or change production application.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

W,H=693,1444
CROP=(235,515,445,720)

def make_mask(geometry, blur=.35):
    ss=4
    m=Image.new("L",(W*ss,H*ss),0)
    d=ImageDraw.Draw(m)
    d.polygon([(round(x*ss),round(y*ss)) for x,y in geometry["outline"]],fill=255)
    for hole in geometry["holes"]:
        d.polygon([(round(x*ss),round(y*ss)) for x,y in hole],fill=0)
    m=m.resize((W,H),Image.Resampling.LANCZOS)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

def checkerboard(size,tile=16):
    im=Image.new("RGBA",size,(35,33,46,255))
    d=ImageDraw.Draw(im)
    for y in range(0,size[1],tile):
        for x in range(0,size[0],tile):
            if ((x//tile+y//tile)%2)==0:
                d.rectangle((x,y,x+tile-1,y+tile-1),fill=(77,71,89,255))
    return im

def one(theme,source,mask,geometry,folder):
    data=source.read_bytes()
    if data[:4]!=b"RIFF":raise ValueError("Expected original WebP: "+str(source))
    im=Image.open(source).convert("RGBA")
    if im.size!=(W,H):raise ValueError("Wrong source dimensions: "+str(im.size))
    cutout=im.copy();cutout.putalpha(mask)
    hole=im.copy();hole.putalpha(ImageOps.invert(mask))
    mdir=folder
    cutout.save(mdir/f"{theme}-fist-source-pixels-UNAPPROVED.png")
    hole.save(mdir/f"{theme}-UNDERPAINT-REQUIRED.png")
    mask.save(mdir/f"{theme}-mask-UNAPPROVED.png")
    # A separate decoded RGBA image is used to verify exact rest-pose pixels.
    im.save(mdir/f"{theme}-original-pixels-UNALTERED.png")
    check=Image.open(mdir/f"{theme}-original-pixels-UNALTERED.png").convert("RGBA")
    if check.tobytes()!=im.tobytes():
        raise AssertionError("Original-pixel verification failed")
    outline=geometry["outline"]
    overlay=im.copy();od=ImageDraw.Draw(overlay)
    pts=[tuple(round(v) for v in p) for p in outline]
    od.line(pts+[pts[0]],fill=(255,215,111,255),width=2)
    for part in geometry["holes"]:
        v=[tuple(round(z) for z in p) for p in part]
        od.line(v+[v[0]],fill=(81,225,222,255),width=1)
    crops=[]
    for name,part in [("Original",im),("Rough outline",overlay),
                      ("Source pixels only",cutout),("UNPAINTED gap",hole)]:
        patch=part.crop(CROP)
        if name in ("Source pixels only","UNPAINTED gap"):
            bg=checkerboard(patch.size);bg.alpha_composite(patch);patch=bg
        crops.append((name,patch.convert("RGB")))
    return crops,{
        "source_file":str(source),
        "sha256_webp":hashlib.sha256(data).hexdigest(),
        "bytes_webp":len(data),
        "source_dimensions":[W,H],
        "mask_bounds":mask.getbbox(),
        "mask_area_nonzero":sum(px>0 for px in mask.tobytes())
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--night",type=Path,required=True)
    p.add_argument("--day",type=Path,required=True)
    p.add_argument("--geometry",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    a=p.parse_args()
    a.output.mkdir(parents=True,exist_ok=True)
    geometry=json.loads(a.geometry.read_text(encoding="utf-8"))
    if geometry.get("status")!="UNAPPROVED" or geometry.get("target_resolution")!=[W,H]:
        raise ValueError("Refusing undocumented or non-source-resolution geometry")
    mask=make_mask(geometry)
    # Hard fail if screenshot-to-source mapping ever targets the panda's face again.
    bounds=mask.getbbox()
    if not bounds or not (220<=bounds[0]<=270 and 730<=bounds[1]<=820 and 320<=bounds[2]<=395 and 870<=bounds[3]<=935):
        raise ValueError("Castet mask is not positioned on the viewer-left fist: "+repr(bounds))
    if len(geometry["holes"])!=4:
        raise ValueError("Expected four reviewed brass-ring interior contours")
    report={
        "review":"UNAPPROVED - NOT AN ANIMATION",
        "source_original_preserved":True,
        "hand_painted_background":False,
        "hand_painted_hidden_sleeve":False,
        "requires_manual_edge_review":True,
        "themes":{}
    }
    crop_w,crop_h=CROP[2]-CROP[0],CROP[3]-CROP[1]
    gap=12;top=28
    out=Image.new("RGB",(4*(crop_w+gap)+gap,2*(crop_h+gap+top)+gap),(16,14,28))
    labels=ImageDraw.Draw(out)
    for row,(theme,path) in enumerate([("night",a.night),("day",a.day)]):
        patches,info=one(theme,path,mask,geometry,a.output)
        report["themes"][theme]=info
        for col,(name,patch) in enumerate(patches):
            x=gap+col*(crop_w+gap)
            y=gap+row*(crop_h+top+gap)
            out.paste(patch,(x,y+top))
            labels.text((x+4,y+5),theme.upper()+" / "+name,fill=(248,226,184))
    out.save(a.output/"original-vs-layer-NIGHT-DAY-UNAPPROVED.png")
    (a.output/"ART-STATUS.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__":main()
