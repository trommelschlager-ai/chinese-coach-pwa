#!/usr/bin/env python3
"""Import Street clips and sources as one validated Git batch."""
import argparse
import hashlib
import json
import re
import subprocess
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "assets/panda-street-voice-v20261125.js"
LEGACY = ROOT / "assets/panda-street-voice-v20261125"
MARKER = re.compile(r"(/\* street-audio-batches \*/)(.*?)(/\* end street-audio-batches \*/)", re.S)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def normalize(text):
    return "".join(c for c in unicodedata.normalize("NFC", text)
                   if not c.isspace() and not unicodedata.category(c).startswith("P"))


def validate_mp3(data):
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=codec_name", "-of", "csv=p=0", "pipe:0"],
        input=data, check=True, capture_output=True,
    )
    if probe.stdout.strip() != b"mp3":
        raise ValueError("Expected an MP3 audio stream")
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-xerror", "-i", "pipe:0", "-map", "0:a:0",
         "-ac", "1", "-ar", "12000", "-f", "s16le", "pipe:1"],
        input=data, check=True, capture_output=True,
    ).stdout
    if not any(pcm):
        raise ValueError("Empty or silent MP3")
    return round(len(pcm) / 24000, 3)


def check_file(entry):
    path = ROOT / entry["src"]
    data = path.read_bytes()
    if len(data) != entry["bytes"] or digest(data) != entry["sha256"]:
        raise ValueError(f"Integrity check failed: {path.relative_to(ROOT)}")
    if abs(validate_mp3(data) - entry["seconds"]) > 0.05:
        raise ValueError(f"Unexpected duration: {path.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--batch")
    parser.add_argument("--lesson", type=int)
    parser.add_argument("--role", default="male", choices=["male", "female"])
    parser.add_argument("archive", type=Path, nargs="?")
    parser.add_argument("originals", type=Path, nargs="*")
    args = parser.parse_args()
    script = REGISTRY.read_text()
    batches = json.loads(MARKER.search(script)[2])
    if args.check:
        for batch in batches.values():
            for entry in batch["originals"] + batch["clips"]:
                check_file(entry)
        print(f"Verified {sum(len(b['originals']) + len(b['clips']) for b in batches.values())} MP3 references")
        return
    if not args.batch or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.batch):
        parser.error("--batch must be a lowercase hyphenated name")
    if not args.lesson or args.lesson < 1 or not args.archive or not args.originals:
        parser.error("provide --lesson, archive and originals in recording order")

    prior = batches.get(args.batch)
    tracked = {entry["src"]: entry["sha256"] for batch in batches.values()
               for entry in batch["originals"] + batch["clips"]}
    legacy = json.loads((LEGACY / "manifest.json").read_text())["clips"]
    phrases = {(args.role, normalize(c["hanzi"])): "./" + (LEGACY / c["file"]).relative_to(ROOT).as_posix()
               for c in legacy if c["role"] == args.role}
    by_hash = {digest((ROOT / path).read_bytes()): path for path in phrases.values()}
    by_hash.update({sha: path for path, sha in tracked.items()})
    for batch_name, batch in batches.items():
        if batch_name != args.batch:
            phrases.update({(c["role"], normalize(c["hanzi"])): c["src"] for c in batch["clips"]})
    writes = {}

    def file_entry(data, directory, name):
        sha = digest(data)
        src = by_hash.get(sha, f"./{directory}/{name}")
        path = ROOT / src
        if path.exists() and digest(path.read_bytes()) != sha:
            raise ValueError(f"Refusing to replace {src}; use another batch name")
        by_hash[sha] = src
        if not path.exists():
            writes[path] = data
        return {"src": src, "sha256": sha, "bytes": len(data), "seconds": validate_mp3(data)}

    originals = []
    for path in args.originals:
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.mp3", path.name):
            raise ValueError(f"Invalid source filename: {path.name}")
        if any(entry["file"] == path.name for entry in originals):
            raise ValueError(f"Repeated source filename: {path.name}")
        originals.append({"file": path.name, **file_entry(path.read_bytes(),
                           f"audio-source/panda-street/{args.batch}", path.name)})

    clips = []
    with zipfile.ZipFile(args.archive) as archive:
        rows = json.loads(archive.read("manifest.json"))
        names = [r["file"] for r in rows]
        if (not names or len(set(names)) != len(names)
                or any(not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.mp3", name) for name in names)
                or sorted(archive.namelist()) != sorted(["manifest.json", *names])):
            raise ValueError("ZIP contents must match unique MP3 filenames in manifest.json")
        source_index, previous_end = 0, 0
        for row in rows:
            name, hanzi = row["file"], row["expected_text"].strip()
            start, end = float(row["start"]), float(row["end"])
            if start < previous_end:
                source_index += 1
                previous_end = 0
            if (source_index >= len(originals) or not hanzi
                    or not previous_end <= start < end <= originals[source_index]["seconds"] + 0.05):
                raise ValueError(f"Invalid source timing or phrase for {name}")
            key = args.role, normalize(hanzi)
            entry = file_entry(archive.read(name), f"assets/panda-street-audio/{args.batch}", name)
            if abs(entry["seconds"] - (end - start)) > 0.15:
                raise ValueError(f"Clip duration does not match source interval: {name}")
            if key in phrases and entry["src"] != phrases[key]:
                raise ValueError(f"{hanzi} already has a recording at {phrases[key]}; reuse its registry lookup")
            phrases[key] = entry["src"]
            clips.append({"file": name, "hanzi": hanzi, "role": args.role, **entry,
                          "original": originals[source_index]["file"], "start": start, "end": end,
                          "sourceReview": row.get("status", "unspecified")})
            previous_end = end
        if source_index + 1 != len(originals):
            raise ValueError("Source count does not match the clip groups")

    batch = {"lesson": args.lesson, "archive": args.archive.name, "originals": originals, "clips": clips}
    if prior is not None and prior != batch:
        raise ValueError("Batch already registered with different content; choose a new name")
    batches[args.batch] = batch
    updated = MARKER.sub(lambda m: m[1] + json.dumps(batches, ensure_ascii=False, indent=2) + m[3], script, count=1)
    for path, data in writes.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    if updated != script:
        tmp = REGISTRY.with_suffix(".tmp")
        tmp.write_text(updated)
        tmp.replace(REGISTRY)
    print(f"{args.batch}: {len(originals)} originals, {len(clips)} clips, {len(writes)} new files")


if __name__ == "__main__":
    main()
