# Panda Go HSK 1 v159 — approved second female voice

## Decision and release scope
- The user listened to two alternative Kokoro female voices and selected **the second — `zf_xiaoni`**.
- The selected female voice replaces 123 generated female lessons phrases across **all seven HSK 1 topics**.
- The 14 male lines continue to use the original `zm_yunjian` recordings from v156.
- The single character **日 (rì)** continues to use the native-speaker Yue Tan recording under CC BY-SA 3.0 US (see `assets/hsk1-voice-corrections-v157/README.md`).
- Kokoro-82M source: `hexgrad/Kokoro-82M`, Apache 2.0 licence.
- Female playback rate **1.0×**; the earlier 1.12× speed workaround is removed. Male and the native `日` sample also remain 1.0×.

## Preflight
- `assets/hsk1-voices-v159/manifest.json`: exactly **123 generated MP3**, all `zf_xiaoni`.
- `assets/hsk1-voices-map-v159.js`: 124 female entries (123 new + native `日`) and 14 unchanged male entries.
- `node scripts/verify-hsk1-voices-v156.cjs`: verify all 138 exact-language and gender mappings, seven conversations, MP3 integrity and natural playback speed.
- `npm run check` and `npm run check:release` (plus actual Android 360/390/412-pixel visual QA).
- The service-worker cache is refreshed to v159, and audio files download on demand so that the phone does not require all 123 MP3 at first load.

## Limitations and validation
The user approved the **voice timbre**, not the phonetic accuracy of every generated word. The manifest has `human_tone_audit_complete: false`. Pronunciation, third-tone sandhi, final consonants and any unnatural characters must be reviewed by a qualified Mandarin speaker before paid-course claims of fully verified pronunciation. Existing user progress and design are not changed.
