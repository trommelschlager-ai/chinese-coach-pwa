"""Reject incomplete, incorrectly sized or unapproved full-screen HSK2 posters."""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "assets/hsk2-approved-covers/scenes-manifest.json").read_text(encoding="utf-8"))
assert len(manifest) == 10, "Exactly ten approved lesson covers are required"
for index, item in enumerate(manifest, 1):
    assert item["lesson"] == index, f"Unexpected lesson order: {index}"
    path = ROOT / item["path"]
    assert path.is_file(), f"Missing full-screen poster: {path}"
    with Image.open(path) as im:
        w, h = im.size
        assert im.format == "WEBP", f"Must be a WebP poster: {path}"
        assert w >= item["min_width"] and h >= item["min_height"], f"Low-res poster: {path}"
        target = item["aspect_ratio"][0] / item["aspect_ratio"][1]
        assert abs((w / h) - target) < 0.002, f"Poster has wrong screen aspect: {path} ({w}x{h})"
    assert item.get("approved") is True, f"Poster not visually approved: {path}"
    checksum = item.get("sha256")
    assert checksum and len(checksum) == 64, f"No locked checksum for approved poster: {path}"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == checksum, f"Wrong approved bytes: {path}"
print("All ten full-screen HSK2 posters are verified and approved")
