# Panda Go v130 — visual acceptance remains blocked

final result: blocked

## Source visual truth

- Approved twelve-screen board: `33156(2).png`, ChatGPT file `libfile_6d5881ac8e448191957bc7f7123f8dd9`.
- Local source at implementation time: `/workspace/scratch/a532b72b72a8/references/33156(2).png`.
- Original board: 1536 × 1536 pixels; individual screen illustrations are roughly 300 pixels wide.
- Crop coordinates, source checksum and encoding are recorded in `qa/v130/reference-assets.json`.
- All 23 extracted assets are lossless WebP crops. No generative replacement, resampling or sharpening was applied to those assets.

## Rendered implementation evidence

- Intended preview: `http://terminal.local:4173/`.
- Preview command: `sites-preview start /workspace/scratch/a532b72b72a8/panda-go`.
- Browser response: `upstream connect error or disconnect/reset before headers. reset reason: connection termination`.
- The initial navigation also timed out. A restart through the supported preview command and one browser reload did not restore access.
- Implementation screenshot path: unavailable; no application screen rendered in this preview.
- Viewports to capture once access is restored: 360 × 640, 390 × 720, 412 × 915, desktop 1363 × 936. The new desktop shell targets 390 × 720 CSS px. Density normalization, clipping and overflow require browser measurement.
- Full-view and focused-region reference/implementation comparisons: **not possible**. There is no valid combined comparison image.
- Browser console error check and mobile interactions: **not verified**. DOM tests do not replace those checks.

## Findings and required fidelity surfaces

- [P1] Visual acceptance blocked for all twelve states. Inspect home, study menu, training menu, practice question, quiz question, game menu, phrase builder, completed session, tones, word card, Hanzi and dialogue in a working browser preview before merging.
- [P1] Typography is provisional. Arial and platform CJK fallbacks are used; weight, wrapping, optical sizing and glyph rendering have not been compared to the board.
- [P1] Spacing/layout rhythm is provisional. Cards, screen frame, 2 × 2 home grid, answer bank, navigation and bottom actions are implemented, but actual mobile overflow and touch layout are unmeasured.
- [P1] Colors/tokens and artwork blending need comparison. Glazed lilac/pink surfaces are implemented; exact palette, shadows, image boundaries and decorative crops are not visually accepted.
- [P1] Image fidelity is limited by the provided collage. Crops preserve the source pixels, but the flattened board is not a collection of full-resolution, transparent assets. Desktop enlargement cannot recreate missing detail. The cropped dialogue scenery also cannot fully reproduce the original layered two-character illustration.
- [P1] Copy/content remains partly course-driven. The original ten Hanzi are retained (first character 大); the board illustrates 爱, for which this repository has no stroke data. The vocabulary and dialogue content comes from the real course rather than hard-coded screenshot samples. Check text, tones and any deliberate differences explicitly.
- [P1] Legacy access paths require reconciliation. Full sequential lessons, memory/translation practice, microphone/reading tools and settings remain accessible through the new shell. The direct standalone `game.html`, travel module and advanced legacy screens retain their prior layouts. They must not be described as the completed approved design.
- [P2] Inspect the result illustration for duplicated headings and appropriate feedback on imperfect scores.
- [P2] The quick test uses the existing question pool and reports elapsed time; it has no countdown limit.

## Verification completed in code

`npm run check` and `npm run check:release` include `scripts/verify-panda-v130.cjs`.

The added DOM regression exercises actual application boot, four home destinations, study/training navigation, all 193 words and 13 categories, known-word persistence, pinyin preference, MP3 path existence, tone examples, dialogue paging/notes, answer selection, token removal/reordering, incorrect-order rejection, score persistence, reset lockout after checking, idempotent result rewards, topic changes, incompatible-session browser Back and return from legacy course to the new home.

Existing regression suites retain the writing engine, original voices, course material, pronunciation tools, progress export/import and offline downloads. MP3 path validation is not an acoustic listening test; mixed legacy voice sources remain as before.

## Comparison history

1. Prior v129 was visually observed in the published app and differed from the approved board: full-width home rows instead of a 2 × 2 grid, emoji-based study navigation and washed-out scene composition.
2. v130 changes those structures in source and reuses cropped original artwork.
3. New browser-rendered evidence is unavailable. No visual pass is claimed and this branch is not eligible for production deployment.

## Next checks, in order

1. Restore the supported local preview and capture the twelve states at matching screen proportions.
2. Place normalized reference/implementation pairs in one comparison image; include focused typography, icons, card and artwork regions.
3. Fix P1/P2 differences; verify mobile fit, tap targets, keyboard and browser Back.
4. Listen to words, dialogue and phrase audio in the browser; check playback cancellation and microphone permission/recording flows.
5. Verify live Hanzi strokes, incomplete/wrong answers, result persistence and offline reload.
6. Repeat visual comparisons. Merge/deploy only after this report can honestly say `final result: passed`.
