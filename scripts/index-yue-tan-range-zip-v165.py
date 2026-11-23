#!/usr/bin/env python3
"""Inspect the central directory of a 600 MB licensed Mandarin ZIP via HTTP Range.

Read a few megabytes of ZIP metadata, not 600 MB of archive. Verify *exact*
Yue Tan source / Chinese word matches before ever staging production audio.
This read-only step does not create, edit, or publish lesson audio.
"""
from __future__ import annotations
import io
import json
import pathlib
import re
import time
import urllib.request
import zipfile
from urllib.error import URLError, HTTPError

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"review/hsk1-yue-tan-v163"
URL="https://www.dropbox.com/s/bh3ctzsgwbagbw0/fc_mandarin_audio_pack.zip?dl=1"
FORBIDDEN=["forvo","sinosplice","chinese_lessons"]  # these have noncommercial licenses
NON_HANZI=re.compile(r"[^\u3400-\u9fff]")

class RemoteZip(io.RawIOBase):
    """Seekable HTTP 206 binary source, with a small aligned range cache."""
    def __init__(self,url):
        self.url=url
        self.pos=0
        self.hits=0
        self.requests=0
        self.cached_start=-1
        self.cached=b""
        req=urllib.request.Request(url,headers={
             "User-Agent":"PandaGoNativeChineseArchive/1.0",
             "Range":"bytes=0-0"})
        with urllib.request.urlopen(req,timeout=50) as r:
            if r.status!=206:raise RuntimeError("Need byte-range support for 604 MB ZIP")
            self.last_redirect=r.url  # Dropbox signs redirected URLs per request; ALWAYS repeat requests to the canonical Dropbox share link.
            match=re.search(r"/(\d+)$",r.headers.get("Content-Range",""))
            if not match:raise RuntimeError(f"No Content-Range: {r.headers}")
            self.length=int(match.group(1))
            assert self.length>100_000_000
            self.requests+=1

    def seekable(self):return True
    def readable(self):return True
    def tell(self):return self.pos
    def seek(self,offset,whence=io.SEEK_SET):
        if whence==io.SEEK_END:self.pos=self.length+offset
        elif whence==io.SEEK_CUR:self.pos+=offset
        else:self.pos=offset
        if not 0<=self.pos<=self.length:raise ValueError("Seek outside archive")
        return self.pos

    def _range(self,start,end):
        req=urllib.request.Request(self.url,headers={
             "User-Agent":"PandaGoNativeChineseArchive/1.0",
             "Range":f"bytes={start}-{end}"})
        last=None
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req,timeout=60) as r:
                    if r.status!=206:
                        raise RuntimeError(f"Expected HTTP 206, got {r.status}")
                    actual=r.read()
                    if len(actual)!=(end-start+1):
                        raise RuntimeError(f"Truncated range {start}:{end} => {len(actual)}")
                    self.requests+=1
                    return actual
            except Exception as err:
                last=err;time.sleep(2*(attempt+1))
        raise RuntimeError(f"Failed range {start}-{end}: {last}")

    def read(self,n=-1):
        if self.pos>=self.length:return b""
        if n is None or n<0:n=self.length-self.pos
        n=min(n,self.length-self.pos)
        output=bytearray()
        while n>0:
            if self.cached_start<=self.pos<self.cached_start+len(self.cached):
                i=self.pos-self.cached_start
                fragment=self.cached[i:i+n]
                output.extend(fragment)
                self.pos+=len(fragment)
                n-=len(fragment)
                self.hits+=1
                continue
            start=self.pos
            end=min(self.length-1,start+max(n,512*1024)-1)
            end=min(end,start+4*1024*1024-1)
            self.cached=self._range(start,end)
            self.cached_start=start
        return bytes(output)

def clean(s):return NON_HANZI.sub("",s)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    brief=json.loads((OUT/"remaining-recording-brief.json").read_text(encoding="utf-8"))
    needs=brief["phrases"]
    remote=RemoteZip(URL)
    with zipfile.ZipFile(remote) as z:
        names=z.namelist()
    print("ZIP index successfully read",len(names),"files, requests:",remote.requests,
          "file size:",remote.length,flush=True)
    dirs={}
    for n in names:
        parts=n.split("/")
        top="/".join(parts[:min(len(parts),2)])
        dirs[top]=dirs.get(top,0)+1
    source=[n for n in names if "shtooka_caen_tan" in n.lower() and n.lower().endswith((".flac",".mp3",".ogg"))]
    print("ACTUAL YUE TAN AUDIO ITEMS:",len(source),flush=True)
    print("sample filenames:",source[:12],flush=True)
    if not source:
        print("First 40 archive paths",names[:40],flush=True)
    rows=[]
    for item in needs:
        wanted=clean(item["canonical"])
        hits=[n for n in source if wanted and clean(pathlib.PurePosixPath(n).stem.rsplit('_',1)[-1])==wanted]
        rows.append({"text":item["canonical"],"pinyin":item.get("pinyin"),
             "archive_candidates":hits[:15],"candidate_count":len(hits),
             "status":"CANDIDATE_NEEDS_AUDIO_AND_TONE_VALIDATION" if hits else
                      "NOT_FOUND_IN_ORIGINAL_ARCHIVE_INDEX"})
    report={
      "status":"ARCHIVE_INDEX_ONLY_NO_NEW_AUDIO_RELEASED",
      "archive_size_bytes":remote.length,
      "archive_zip_files_total":len(names),
      "verified_yue_tan_archive_files":len(source),
      "metadata_range_requests":remote.requests,
      "source_file_sample":source[:30],
      "top_dirs":dict(sorted(dirs.items(),key=lambda kv:-kv[1])[:25]),
      "unique_missing_lookups":len(rows),
      "potential_additional_exact_matches":sum(1 for x in rows if x["candidate_count"]>0),
      "entries":rows,
      "source":"Trevor L. Davis Free Cultural Works Mandarin Audio Pack, Shtooka Caen Tan source only",
      "license":"Yue Tan / Shtooka CC BY-SA 3.0 US",
      "note":"ZIP member name is NOT a verified matching recording; all candidates require transcription and listening audit."}
    path=OUT/"full-archive-index-v165.json"
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("POTENTIAL NEW YUE TAN HSK1 ENTRIES:",report["potential_additional_exact_matches"],flush=True)
    print("RESULT:",path,flush=True)

if __name__=="__main__":
    main()
