# Panda Go HSK2 — release checklist for 10 thematic bottom scenes

**Status:** integration code is in this separate branch, but the ten binary WebP
assets must be uploaded before the PR can be merged. Main remains unchanged.

## Upload package
Panda_Go_HSK2_10_thematic_scenes.zip contains exactly the required files under
`assets/hsk2-approved-covers/`. Unpack it and upload
`lesson-01-scene.webp` … `lesson-10-scene.webp`.
Keep existing `lesson-XX.png`, `lesson-XX-tail.webp`, audio, tests and progress intact.
`scenes-manifest.json` is already in the branch.

## Implementation
`assets/hsk2-approved-cover.js` preloads the WebP for each active HSK2 lesson.
If it is missing/invalid, the previous cover is displayed unchanged. If present,
it adds an image backdrop below the existing «Начать урок» button, covering the
old reward/floor section. Hit targets, navigation, voices, practice, scores and
storage are untouched. `assets/hsk2-approved-cover.css` styles the layer.

## Quality gate (must pass BEFORE merge)
1. `python tests/hsk2-thematic-scene-check.py` reports 10 assets present and exact SHA256/size.
2. Check actual HTML lessons 1–10 in Android Chrome at 360×800, 393×873 and 412×915.
3. Check no blank bands, face cropping, horizontal stretching, broken tap zones or scrolling.
4. Check Back, Start, all six lesson section hotspots, voice, tests and persisted progress.
5. Verify loaded WebP art doesn't cover «Начать урок» or the back button.
6. Take screenshots of all ten lessons and compare to the approved lesson-1 tea-room aesthetic.
7. Only merge after user inspects the real previews. No auto-publish from this branch.

A contact sheet / ZIP is provided in the conversation where this draft PR was created.
