# Panda Go HSK1 · Lesson 3 · Audio sources and transformations (v213)

The 0–99 recordings in `assets/hsk1-numbers-clean-v213/` are derivative
teaching files created from authentic individual digits spoken by **Yue Tan**
(Shtooka Mandarin collection `cmn-caen-tan`, © 2009 Shtooka Project).

Source catalogue: [Hugo Lopez audio-cmn](https://github.com/hugolpz/audio-cmn).
Source manifest with individual file provenance:
`assets/yue-tan-human-v166.json`.

**License:** [Creative Commons Attribution–ShareAlike 3.0 United States
(CC BY-SA 3.0 US)](https://creativecommons.org/licenses/by-sa/3.0/us/).
The source clips and the adapted recordings are subject to the stated license;
do not represent original contributors as endorsing this app. Preserve their
credit, license and transformation disclosure in redistributions. Derived
audio materials are offered under compatible CC BY-SA terms.

Changes made reproducibly by
`scripts/build-hsk1-numbers-audio-v213.py`:
- Mild 70 Hz high-pass filter and conservative noise attenuation.
- Trimming leading/trailing silence with generous speech margins.
- Level matching and short edge fades without altering the pitch contour.
- For 11–99, stitch syllables from the same source speaker with 52ms pauses.
- Encode MP3 at 128 kbps. **No voice cloning or generated human imitation.**

These sequences **are not continuous original recordings of spoken numbers**.
A sound engineer and native speaker must still validate transitions, tones and
clarity on Android and headphones; automated checks are not human audio QA.

**Exception: 100 (一百, yì bǎi)** is *not* stitched from isolated first-tone
一 (yī), because that would teach the wrong tone. An explicit system Chinese
TTS fallback is labeled in the UI until verified natural `yì bǎi` is available.

The file set was created to improve listening consistency without modifying
legacy lesson 1–2 recording assets.
