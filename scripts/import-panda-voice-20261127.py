#!/usr/bin/env python3
"""Import only the exact owner-supplied November 27 voice pack. No code from ZIP."""
import hashlib, json, pathlib, re, zipfile

root = pathlib.Path(__file__).resolve().parents[1]
archive = root / "panda-voice-upload-20261127.zip"
assert hashlib.sha256(archive.read_bytes()).hexdigest() == "17e5412e1dd90adf994475b29d832c5f560a72becf029332cdfa0dd4c3e4373b", "Unexpected archive bytes"
def read(path): return (root / path).read_text(encoding="utf-8")
def write(path, content): (root / path).write_text(content, encoding="utf-8")
def dump(obj): return json.dumps(obj, ensure_ascii=False, indent=2)
def replace_once(text, old, new):
    assert text.count(old) == 1, "Source changed: " + old[:100]
    return text.replace(old, new, 1)
def norm(s): return re.sub(r"[。！？?!，,、；;：:\s]", "", s)

with zipfile.ZipFile(archive) as z:
    manifest = json.loads(z.read("manifest.json"))
    entries = manifest["clips"]
    female = [x for x in entries if x["role"] == "panda-ai-female"]
    male = [x for x in entries if x["role"] == "street-male"]
    assert len(entries) == 60 and len(female) == 58 and len(male) == 2
    expected = {norm(x["hanzi"]) for x in json.loads(read("docs/panda-course-voice-audit-v563.json"))["rows"] if not x["approved"]}
    assert len(expected) == 58 and {norm(x["zh"]) for x in female} == expected
    assert {x["zh"]: x["src"] for x in male} == {"你为什么想学中文？":"./assets/panda-street-voice-v20261125/54.mp3","你打算什么时候去？":"./assets/panda-street-voice-v20261125/55.mp3"}
    assert {x["sha256"] for x in male} == {"dd526edf34034b00348a1021e58954f055853044909d130146f57341c4514fdd","bd2450fbf9a89d868007ad1936c9f97a21946d80155070fa0a86cc0052d665c8"}
    paths = [x["src"][2:] for x in entries]
    assert len(set(paths)) == 60 and sorted(z.namelist()) == sorted(["manifest.json"] + paths)
    buffers = {}
    for x in entries:
        path = x["src"][2:]
        allowed = r"assets/panda-ai-voice-20261127/PA-B0[2-6]-\d{2}\.mp3" if x["role"] == "panda-ai-female" else r"assets/panda-street-voice-v20261125/(54|55)\.mp3"
        assert re.fullmatch(allowed, path), path
        b = z.read(path)
        assert len(b) == x["bytes"] and hashlib.sha256(b).hexdigest() == x["sha256"], path
        assert not (root/path).exists(), "Do not overwrite existing audio: " + path
        buffers[path] = b

registry = "assets/panda-approved-voice-registry-v516.mjs"
r = read(registry)
r = replace_once(r, "export function lookupApprovedPandaVoice(text){", "export const PANDA_USER_20261127_BATCH=Object.freeze(" + dump(female) + ");\nconst USER_20261127_BY_ZH=new Map(PANDA_USER_20261127_BATCH.map(e=>[voiceNorm(e.zh),e]));\nexport function lookupApprovedPandaVoice(text){")
r = replace_once(r, "return supplied?{src:supplied.src,start:0,end:null,source:'panda-user-upload:batch01-v563'}:null;", "if(supplied)return {src:supplied.src,start:0,end:null,source:'panda-user-upload:batch01-v563'};\n const added=USER_20261127_BY_ZH.get(key);return added?{src:added.src,start:0,end:null,source:'panda-user-upload:20261127'}:null;")
street = "assets/panda-street-voice-v20261125.js"
s = replace_once(read(street), '["你真棒！","male","53.mp3"]];', '["你真棒！","male","53.mp3"],["你为什么想学中文？","male","54.mp3"],["你打算什么时候去？","male","55.mp3"]];')
sm_path = "assets/panda-street-voice-v20261125/manifest.json"
sm = json.loads(read(sm_path))
for x in male:
    path = x["src"][2:]
    b = buffers[path]
    sm["clips"].append({"file":path.split("/")[-1],"hanzi":x["zh"],"role":"male","gitBlobSha":hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest(),"sha256":x["sha256"],"bytes":len(b),"nativeToneReview":"pending"})
pack_path = "assets/offline-pack.json"
pack = json.loads(read(pack_path))
assert pack["version"] == 570
pack["version"] = 571
pack["bytes"] += sum(x["bytes"] for x in entries)
for x in entries:
    assert x["src"] not in pack["files"]
    pack["files"].append(x["src"])
sw = replace_once(read("sw.js"), "chinese-coach-pwa-v570-shared-conversation-home", "chinese-coach-pwa-v571-expanded-voice")
for path,b in buffers.items():
    (root/path).parent.mkdir(parents=True,exist_ok=True)
    (root/path).write_bytes(b)
write(registry,r)
write(street,s)
write(sm_path,dump(sm)+"\n")
write("assets/panda-ai-voice-20261127/manifest.json",dump({"status":manifest["status"],"clips":female})+"\n")
write(pack_path,dump(pack)+"\n")
write("sw.js",sw)
doc = "docs/PANDA-GO-CHECKPOINT-2026-11-26.md"
write(doc,read(doc)+"\n## 17. Import of verified November 27 audio bytes\n58 female Panda AI and 2 male Street clips imported from SHA-256 pinned archive; original clips preserved, exact phrase lookup only, offline pack v571. Native listening and physical Android review pending. No main merge or production publication.\n")
print("Imported 60 verified MP3 files; registry and offline pack updated. Run regression before commit.")
