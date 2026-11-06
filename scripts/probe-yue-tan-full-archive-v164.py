#!/usr/bin/env python3
"""Test reachable full (8,597-file) Yue Tan originals and mirrors, no bulk downloads.

This is a read-only source availability audit, NOT evidence of a real HSK1 clip
until it has an exact phrase match and reproducible provenance.
"""
from __future__ import annotations
import json, pathlib, re, ssl, urllib.request, urllib.error
from urllib.parse import urljoin

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"review/hsk1-yue-tan-v163"
URLS=[
("shtooka_original_http","http://download.shtooka.net/cmn-caen-tan_flac.tar"),
("shtooka_original_https","https://download.shtooka.net/cmn-caen-tan_flac.tar"),
("shtooka_ogg_original","https://download.shtooka.net/cmn-caen-tan_ogg.tar"),
("shtooka_credits","https://packs.shtooka.net/cmn-caen-tan/readme.txt"),
("shtooka_pack_index","https://packs.shtooka.net/cmn-caen-tan/"),
("yojik_archive_listing","https://www.yojik.eu/oldshtooka/download.html"),
("yojik_archive_listing_2","https://aijan.yojik.net/oldshtooka/download.html"),
("commercial_permitted_audio_pack","https://www.dropbox.com/s/bh3ctzsgwbagbw0/fc_mandarin_audio_pack.zip?dl=1"),
]
def probe(label,url):
    entry={"label":label,"requested_url":url}
    headers={"User-Agent":"Mozilla/5.0 PandaGoYueTanMetadata/1.0","Range":"bytes=0-2047"}
    try:
        req=urllib.request.Request(url,headers=headers)
        with urllib.request.urlopen(req,timeout=13) as res:
            b=res.read(2048)
            entry.update({"http_status":res.status,"final_url":res.url,
                 "content_type":res.headers.get("Content-Type"),
                 "content_length_header":res.headers.get("Content-Length"),
                 "content_range":res.headers.get("Content-Range"),
                 "read_bytes":len(b),
                 "sample_prefix_hex":b[:16].hex(),
                 "accessible":True})
            if b"<html" in b.lower() or b"<!doctype" in b.lower():
                src=b.decode("utf8",errors="replace")
                links=re.findall(r'href=["\\x27]([^"\\x27]+)',src,flags=re.I)
                entry["page_links_containing_cmn"]=[urljoin(res.url,l) for l in links if "cmn" in l.lower()][:20]
                if "dropbox" in res.url:
                    entry["warning"]="HTML preview is not downloadable audio!"
            else:
                entry["seems_binary"]=b[:2] in (b"PK",b"\\x1f\\x8b") or (len(b)>256 and b"<html" not in b.lower())
    except Exception as exc:
        entry.update({"accessible":False,"error":type(exc).__name__+": "+str(exc)[:220]})
    print(label,entry.get("http_status",entry.get("error")),entry.get("final_url"),flush=True)
    return entry

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    data={"status":"READ_ONLY_SOURCE_PROBE_NO_NEW_AUDIO_CLAIM",
          "target":"Yue Tan full original 8,597 recordings vs 5,596-file MP3 subset",
          "source_probes":[probe(label,url) for label,url in URLS],
          "note":"Even if a URL is reachable, exact recordings still require verified index, metadata, file inspection, tone QA, and licensing."}
    OUT.joinpath("full-archive-probe-v164.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("AVAILABLE:",sum(x["accessible"] for x in data["source_probes"]),"of",len(URLS),flush=True)

if __name__=="__main__":main()
