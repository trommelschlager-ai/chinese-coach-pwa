#!/usr/bin/env python3
"""Import the exact owner-supplied 86-clip archive. Never download or synthesize audio."""
import csv, hashlib, io, json, pathlib, re, subprocess, unicodedata, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "Panda_AI_86_MP3.zip"
FOLDER = "assets/panda-ai-voice-20261128"
EXPECTED_SHA = "3b276f9d420672218a4af885b951c52a59e02ef626b183fea70f72313c60d2d9"
def require(condition, message):
    if not condition:
        raise ValueError(message)
def sha(data):
    return hashlib.sha256(data).hexdigest()
def norm(s):
    return ''.join(c for c in unicodedata.normalize("NFC",s)
                   if not c.isspace() and not unicodedata.category(c).startswith("P"))
require(sha(ARCHIVE.read_bytes()) == EXPECTED_SHA, "Archive differs from the checked chat file")
with zipfile.ZipFile(ARCHIVE) as z:
    rows = list(csv.DictReader(io.StringIO(z.read("audio_index.csv").decode("utf-8-sig"))))
    require(len(rows) == 86, "Expected 86 clips")
    require(len({norm(r["zh"]) for r in rows}) == 86, "Duplicate normalized Chinese")
    expected = {"audio_index.csv"}
    clips = []
    data_by_path = {}
    for i, row in enumerate(rows,1):
        id = f"PA-20261128-{i:03d}"
        path = f"{FOLDER}/{id}.mp3"
        require(row["id"] == id and row["src"] == "./"+path, "Unexpected ID/path")
        require(row["role"] == "panda-ai-female" and bool(norm(row["zh"])), "Incorrect role/text")
        data = z.read(path)
        require(len(data) == int(row["bytes"]) and sha(data) == row["sha256"], "Hash mismatch: "+id)
        expected.add(path)
        data_by_path[path] = data
        clips.append({"id":id,"zh":row["zh"],"src":row["src"],"role":row["role"],"bytes":len(data),"sha256":sha(data)})
    actual = [x.filename for x in z.infolist() if not x.is_dir()]
    require(len(actual) == len(expected) and set(actual) == expected, "Unexpected archive entries")
for path, data in data_by_path.items():
    p = ROOT / path
    p.parent.mkdir(parents=True,exist_ok=True)
    require(not p.exists() or p.read_bytes() == data, "Refusing to overwrite existing audio")
    p.write_bytes(data)
    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],check=True)
manifest = {"source":"owner-supplied Luvvoice batch 2026-11-28",
            "source_archive_sha256":EXPECTED_SHA,
            "alignment":"order and timing matched; native listening review pending",
            "clips":clips}
(ROOT/FOLDER/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
reg = ROOT/"assets/panda-approved-voice-registry-v516.mjs"
s = reg.read_text(encoding="utf-8")
anchor = "export function lookupApprovedPandaVoice(text){"
require(s.count(anchor)==1 and "USER_20261128_BY_ZH" not in s,"Registry already imported or changed")
s = s.replace(anchor,"const PANDA_USER_20261128_BATCH=Object.freeze("+json.dumps(clips,ensure_ascii=False,indent=2)+");\nconst USER_20261128_BY_ZH=new Map(PANDA_USER_20261128_BATCH.map(e=>[voiceNorm(e.zh),e]));\n"+anchor)
tail = " const added=USER_20261127_BY_ZH.get(key);return added?{src:added.src,start:0,end:null,source:'panda-user-upload:20261127'}:null;"
require(s.count(tail)==1,"Previous exact voice fallback changed")
s=s.replace(tail," const added=USER_20261127_BY_ZH.get(key);if(added)return {src:added.src,start:0,end:null,source:'panda-user-upload:20261127'};\n const batch86=USER_20261128_BY_ZH.get(key);return batch86?{src:batch86.src,start:0,end:null,source:'panda-user-upload:20261128'}:null;")
reg.write_text(s,encoding="utf-8")
packpath=ROOT/"assets/offline-pack.json"
pack=json.loads(packpath.read_text(encoding="utf-8"))
for item in clips:
    if item["src"] not in pack["files"]: pack["files"].append(item["src"])
packpath.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
sw=ROOT/"sw.js"
s=sw.read_text(encoding="utf-8")
s,n=re.subn(r"(const CACHE='[^']+)'",r"\1-audio86'",s,count=1)
require(n==1,"Cache key not found")
sw.write_text(s,encoding="utf-8")
print("Imported and decoded all 86 original MP3s; older approved recordings retain priority.")
