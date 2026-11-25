#!/usr/bin/env python3
"""Import only the exact user-supplied archive into the release branch."""
import hashlib, json, pathlib, re, sys, zipfile, subprocess
root=pathlib.Path(__file__).resolve().parents[1]
archive=pathlib.Path(sys.argv[1]).resolve()
expected="70142c5ab24743f05226202cd6358d5aefdc92da61f966b33cde2344fd3388a0"
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected, "Unexpected archive SHA256; do not import"
dest=root/"assets/panda-ai-voice-v557"
registry=root/"assets/panda-approved-voice-registry-v516.mjs"
packpath=root/"assets/offline-pack.json"
swpath=root/"sw.js"
audit=root/"qa/panda-dialogue-v556/voice-audit.json"
subprocess.run(["node","scripts/panda-dialogue-voice-audit-v556.mjs"],cwd=root,check=True)
rows=json.loads(audit.read_text())["rows"]
def norm(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFC",s) if not c.isspace() and not unicodedata.category(c).startswith("P"))
wanted={norm(x["hanzi"]) for x in rows if not x["approved"] and not re.match(r"^你(哥哥|姐姐|弟弟|妹妹|爸爸|妈妈|儿子|女儿)[一二三四五六七八九十0-9]+岁！",x["hanzi"])}
assert len(wanted)==64, "Unexpected current voice queue; stop rather than guessing"
with zipfile.ZipFile(archive) as z:
    manifest=json.loads(z.read("manifest.json"))
    clips=manifest["clips"]
    assert len(clips)==64 and len({norm(x["zh"]) for x in clips})==64
    assert {norm(x["zh"]) for x in clips}==wanted, "Archive phrases do not match missing fixed replies"
    payload=[]
    for i,x in enumerate(clips,1):
        assert x["id"]==i and x["file"]==f"PA-V556-{i:03d}.mp3"
        raw=z.read(x["file"])
        assert len(raw)>1000 and hashlib.sha256(raw).hexdigest()==x["sha256"]
        payload.append((x,raw))
reg=registry.read_text()
assert "PANDA_XIAOXIAO_V557_BATCH" not in reg
needle="export function lookupApprovedPandaVoice(text){"
assert reg.count(needle)==1
entries=[{"zh":x["zh"],"src":"./assets/panda-ai-voice-v557/"+x["file"],"sha256":x["sha256"]} for x,_ in payload]
decl="export const PANDA_XIAOXIAO_V557_BATCH=Object.freeze("+json.dumps(entries,ensure_ascii=False,indent=2)+");\nconst XIAOXIAO_V557_BY_ZH=new Map(PANDA_XIAOXIAO_V557_BATCH.map(e=>[voiceNorm(e.zh),e]));\n"
reg=reg.replace(needle,decl+needle)
anchor=" const key=voiceNorm(text);if(!key)return null;"
assert reg.count(anchor)==1
reg=reg.replace(anchor,anchor+"\n const v557=XIAOXIAO_V557_BY_ZH.get(key);if(v557)return {src:v557.src,start:0,end:null,source:'panda-xiaoxiao:user-upload-v557'};")
pack=json.loads(packpath.read_text())
assert pack["version"]==556
pack["version"]=557
for e in entries:
    assert e["src"] not in pack["files"]
    pack["files"].append(e["src"])
pack["bytes"]+=sum(len(raw) for _,raw in payload)
sw=swpath.read_text()
assert "const CACHE='chinese-coach-pwa-v556-natural-routing';" in sw
sw=sw.replace("const CACHE='chinese-coach-pwa-v556-natural-routing';","const CACHE='chinese-coach-pwa-v557-voice-batch';")
dest.mkdir(parents=True,exist_ok=False)
for x,raw in payload:(dest/x["file"]).write_bytes(raw)
(dest/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
registry.write_text(reg)
packpath.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+"\n")
swpath.write_text(sw)
# Verify the actual resolver, exact hashes and the complete offline pack.
script=r"""
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_XIAOXIAO_V557_BATCH as batch,lookupApprovedPandaVoice as lookup} from './assets/panda-approved-voice-registry-v516.mjs';
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json'));
assert.equal(batch.length,64);
for(const x of batch){
 assert.equal(lookup(x.zh).src,x.src);
 assert.equal(createHash('sha256').update(fs.readFileSync(x.src)).digest('hex'),x.sha256);
 assert(pack.files.includes(x.src));
}
assert.equal(pack.version,557);
console.log('PASS 64 exact registered MP3 hashes and offline entries');
"""
subprocess.run(["node","--input-type=module","-e",script],cwd=root,check=True)
subprocess.run(["node","scripts/panda-dialogue-voice-audit-v556.mjs"],cwd=root,check=True)
after=json.loads(audit.read_text())
assert after["approved"]==94 and after["missing"]==8, after
print("PASS 94/102 approved replies; 8 dynamic age replies remain text-only")
