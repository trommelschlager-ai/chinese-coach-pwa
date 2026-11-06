#!/usr/bin/env python3
"""Stage locally captured Mandarin takes for human review. Never installs them into live lessons.

Usage: python3 scripts/stage-hsk1-native-takes-v168.py studio-recordings.zip [--out staging/native-hsk1-v168] [--allow-partial]

Requires ffmpeg and ffprobe.  Converts original WebM/Opus or M4A to labelled MP3
without time stretching or pitch modification.  The originals and rights remain
the responsibility of the recording owner.  *No* voice licensing or tone QA occurs here.
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, subprocess, tempfile, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUEUE = json.loads((ROOT / "assets/hsk1-native-recording-queue-v168.json").read_text(encoding="utf-8"))
EXPECTED = {row["id"]: row for row in QUEUE["items"]}
MAX_BYTES = 20 * 1024 * 1024

def probe(path: pathlib.Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=codec_name,sample_rate,channels:format=duration",
         "-of", "json", str(path)], capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)
    if not info.get("streams"):
        raise ValueError(f"No audio track: {path.name}")
    duration = float(info["format"]["duration"])
    if not 0.3 <= duration <= 30:
        raise ValueError(f"Invalid recording duration {duration:.2f}s: {path.name}")
    return {"codec": info["streams"][0]["codec_name"], "duration_seconds": round(duration, 2)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip_file", type=pathlib.Path)
    parser.add_argument("--out", type=pathlib.Path, default=ROOT / "staging/native-hsk1-v168")
    parser.add_argument("--allow-partial", action="store_true", help="Stage only existing takes; do not mark whole set complete")
    args = parser.parse_args()

    if not args.zip_file.is_file():
        parser.error("Could not find the downloaded ZIP file")
    out = args.out.resolve()
    if out == ROOT or out == pathlib.Path("/") or out.is_relative_to(ROOT / "assets"):
        parser.error("Staging directory must not be the live assets/ directory")
    out.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.zip_file) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate paths inside ZIP")
        if "manifest.json" not in names:
            raise ValueError("ZIP must include studio manifest.json")
        meta = json.loads(archive.read("manifest.json"))
        if meta.get("version") != 168:
            raise ValueError("This ZIP was not exported by the expected v168 studio")
        entries = meta.get("recordings")
        if not isinstance(entries, list):
            raise ValueError("No recordings in ZIP")
        found = set()
        raw = []
        for record in entries:
            id_ = record.get("id")
            if id_ not in EXPECTED or id_ in found:
                raise ValueError("Unexpected or duplicate recording id")
            found.add(id_)
            name = record.get("filename")
            if name not in (f"recordings/{id_}.webm", f"recordings/{id_}.m4a"):
                raise ValueError(f"Unexpected recording filename for {id_}")
            if name not in names or archive.getinfo(name).file_size > MAX_BYTES:
                raise ValueError(f"Recording missing or too large: {name}")
            if record.get("hanzi") != EXPECTED[id_]["hanzi"]:
                raise ValueError(f"Phrase mismatch for {id_}")
            raw.append((id_, name))
        expected_names = {"manifest.json"} | {name for _, name in raw}
        if set(names) != expected_names:
            raise ValueError("ZIP contains unknown/unexpected entries")
        if len(raw) != len(EXPECTED) and not args.allow_partial:
            raise ValueError(f"Only {len(raw)} of {len(EXPECTED)} phrases; re-record missing takes or use --allow-partial")
        if not raw:
            raise ValueError("There are no audio files in the ZIP")

        staged = []
        with tempfile.TemporaryDirectory(prefix="pg-native-") as tmp:
            tmpdir = pathlib.Path(tmp)
            for id_, zip_name in raw:
                src = tmpdir / pathlib.Path(zip_name).name
                src.write_bytes(archive.read(zip_name))
                _ = probe(src)
                mp3 = out / f"{id_}.mp3"
                subprocess.run(
                    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
                     "-y", "-i", str(src), "-vn", "-ar", "44100", "-ac", "1",
                     "-c:a", "libmp3lame", "-q:a", "3", str(mp3)],
                    check=True)
                info = probe(mp3)
                if info["codec"] != "mp3":
                    raise ValueError("Conversion returned the wrong codec")
                text = EXPECTED[id_]
                staged.append({
                    "id": id_, "hanzi": text["hanzi"], "pinyin_reference": text["pinyin_reference"],
                    "mp3_file": mp3.name, "duration_seconds": info["duration_seconds"],
                    "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest(),
                    "is_human": "CLAIMED_BY_STUDIO_OPERATOR_NOT_VERIFIED",
                    "native_tone_checked": False, "commercial_rights_checked": False,
                    "status": "REVIEW_ONLY_NOT_FOR_PUBLICATION",
                })
    (out / "review-manifest.json").write_text(
        json.dumps({"version": 168, "staged": len(staged), "required": len(EXPECTED),
                    "usable_in_production": False, "items": staged}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print(f"Staged {len(staged)}/{len(EXPECTED)} candidate audio files into {out}")
    print("NOT released: native phonetics review and written commercial permission still required.")

if __name__ == "__main__":
    main()
