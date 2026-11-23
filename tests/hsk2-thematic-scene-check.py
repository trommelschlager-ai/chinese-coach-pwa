"""Validate all themed WebP artwork before approving the Panda Go HSK2 UI PR."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "assets/hsk2-approved-covers/scenes-manifest.json").read_text(encoding="utf-8"))
assert len(manifest) == 10, "Expected one scene for each of the 10 HSK2 lessons"
for index, item in enumerate(manifest, 1):
    assert item["lesson"] == index, f"Unexpected lesson order: {index}"
    path = ROOT / item["path"]
    assert path.is_file(), f"Missing themed scene: {path}"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], f"Checksum mismatch: {path}"
    with Image.open(path) as im:
        assert im.format == "WEBP", f"Not WebP: {path}"
        assert list(im.size) == item["size"] == [941, 950], f"Wrong size: {path}"
print("All 10 themed HSK2 scenes verified: WebP, 941×950, matching SHA256.")
