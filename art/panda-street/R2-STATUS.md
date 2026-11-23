# Panda Street AI — castet artwork, R2 status (2026-11-23)

## Critical correction
The R1 mask derived from Android screenshots accidentally isolated the **muzzle**, not the fist. It was rejected after obtaining the actual approved original WebP pixels. Never reuse R1 or animate those fragments.

## Source-of-truth
- `assets/panda-street-day-night/night.webp` and `day.webp` from the experiment branch, immutable approved images `693 × 1444`.
- `art/panda-street/castet-mask-source-v1.UNAPPROVED.json` (schema v2 despite legacy filename) contains a new **hand-traced outline** of the **viewer-left fist holding brass knuckles**, plus four ring interior contours.
- Expected alpha bounding box: **(241, 782, 353, 894)**, within the original source image coordinates.
- `tools/panda_street/castet_art_export.py` asserts that bounding region. If the mask points at the panda's head again, the build fails before exporting.

## Verified
- GitHub Actions art-only build from repository WebP source succeeded: https://github.com/trommelschlager-ai/chinese-coach-pwa/actions/runs/45228353617
- Original decoded pixel images, RGBA castet cutout, alpha masks, and transparent **UNPAINTED** patches generated for both night/day.
- Both themes have the exact same fist source silhouette; details were inspected against both originals.
- Script validates the unchanged rest-frame pixels and rejects wrong source size/bounds.

## Still NOT ready
- The cutout contour is an approximated **preproduction mask**; fine fur edges and gold reflections need individual pixel-level refinement.
- Transparent holes at brass rings need a human edge pass.
- Occluded coat/pants and sleeve hidden behind the fist have **not** been hand-painted.
- **No** natural fist movement, facial speech movement, alternate paw reaction or animation event integration is approved.

## Next art gate
1. Make an artist-reviewed transparent source-pixel layer and clean plate (under the fist) in **both** approved themes.
2. Paint the hidden cuff / hand-wrist anatomy at the hinge. Preserve exact approved rest frame.
3. Paint 4–6 separate fist+castet keyframes with intact silhouette, natural folds, lighting and sleeve continuity. Compare to source at rest.
4. Only after **visual** review run an independent animation preview on Android, then seek explicit approval before integrating.
5. Do not merge PR #201 or modify `main` / audio / lessons without the owner's explicit approval.

## Art-build output
Artifact name: `panda-street-castet-art-UNAPPROVED`. Review via the run link above. No code in this art build writes to the repo or deploys a website.
