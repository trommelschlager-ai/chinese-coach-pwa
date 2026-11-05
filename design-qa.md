# Hanzi v141 — QA blocked, draft only

final result: blocked

Source visual truth: assets/hanzi-approved-v141.png, the exact attached file bytes (named .png, JPEG-encoded); 864 × 1536 pixels. SHA-256: bf2f759f94ecbf6954e38f088f426c99a1ae4d67fbeb39a577cf590beffc7b7a.

Implementation screenshot: unavailable. No browser-rendered mobile screenshot exists for this draft. No visual fidelity pass is claimed.

Required viewports: 360, 393, 412, 430 CSS pixels, with short and tall heights. These have NOT been visually verified. Device density normalization and full-view/focused comparisons have NOT been performed.

## Blocking findings

- P0 verification: managed local preview returns “upstream connect error or disconnect/reset before headers”. Retried after installing dependencies and then using the supported static-directory configuration; both remained unavailable.
- An owner-private test deployment succeeded, but the cloud browser requires a new ChatGPT sign-in. No credentials were requested because the user instructed autonomous execution without questions. No private access gate was bypassed.
- P2 pending: dynamic text wrapping, source-derived clean-paper texture, alternate tabs, long sentences, bottom decoration on tall screens and safe-area behavior require screenshots before acceptance.

## Required fidelity surfaces

- Typography: initial screen lettering stays in the source raster; dynamic HTML text uses available serif CJK and Arial/system fonts. Dynamic font fidelity and wrapping remain unverified.
- Spacing/layout: hotspots measured against 864 × 1536 source. Stage preserves its aspect ratio. Mobile measurements and hit targets remain unverified in a browser.
- Colors: initial source pixels unchanged; alternate text sits over source-derived clean layers. No generated replacement scenery.
- Images: source attachment retained byte-for-byte. Dynamic layers use harmonic interpolation from surrounding source pixels to clear only changing glyph/text. Those layers are not claimed to be visually identical to an unavailable clean original.
- Copy: retained 10 lessons, original word/sentence data and tone marks. Three sentences or three words per character. No learning data or existing storage keys removed.

## Automated checks

- npm run check: passed, including existing course, Hanzi, quiz, audio coverage and offline regression suites.
- node scripts/verify-hanzi-exact-v141.cjs: passed. Tests hotspot routing for all 10 characters, all 30 example-audio actions, meaning/words/examples tabs, animation and quiz initiation, mistake/correct/completion callbacks, persisted progress, next and wraparound.
- These tests use jsdom and mocked media/HanziWriter. They do not verify sound, touch accuracy, actual stroke matching, rendering or Android behavior.
- Existing 10 character MP3 files are retained. Example audio still depends on an installed Mandarin system voice. Real playback has NOT been heard or verified.
- Attempt to prepare additional local sentence audio failed certificate verification; no failed or empty audio files were added, no TLS protection was disabled.
- Browser console on the actual implementation: NOT checked because authentication blocked access.

## Before merging or deploying GitHub Pages

1. Restore a working browser preview and compare source and rendered screenshots in the same image, at matching content dimensions.
2. Check all four widths and several heights. Verify no horizontal scrolling, readable examples and fully accessible bottom button.
3. Check 大 and 人, including switching back to 大. Ensure no original glyph or original sentence remains under dynamic content.
4. Verify every control, actual Mandarin playback and finger drawing with correct and incorrect stroke order on Android.
5. Fix all P0/P1/P2 findings, then change final result to passed with captured evidence.

The default branch and existing GitHub Pages deployment must remain unchanged until this gate passes.
