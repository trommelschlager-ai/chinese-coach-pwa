# Panda AI reference rebuild — review, not a release

Backup branch: `backup/panda-ai-before-reference-rebuild-20261115`, based on `630f792118b33036c0662288852f517e84a6e9e9`.
Work branch: `fix/panda-ai-reference-structure`.

The reference character was extracted from the supplied 865 × 1536 image without generating a replacement. A lossless WebP stores the foreground. Edge cleanup still needs visual approval. The existing clean-scene asset is incomplete: it contains a large cyan fill and fragments of scenery. The original landscape hidden behind the reference UI is not recoverable exactly from the screenshot alone. This branch must not be published until the clean approved landscape is available and visual comparison passes.

## Source changes

| File | Change |
| --- | --- |
| `panda-voice-pilot.html` | Select one presentation entry point and stylesheet. |
| `assets/panda-live-screen-v270.mjs` | Keep the conversation engine; skip unused hidden canvas animation in reference presentation. |
| `assets/panda-ai-view.mjs` | One active presentation, explicit engine import, actual history and lesson options, audio/speech controls, bounded mascot sizing, help access. |
| `assets/panda-ai.css` | Consolidated layout, no `object-fit:fill`, bounded history and speech text, petals, sound waves, reduced-motion support. |
| `assets/panda-reference-character.webp` | Original reference foreground pixels, lossless. |
| `tests/panda-reference-view.test.mjs` | Real-engine integration test for the replacement view. |
| `scripts/qa-panda-reference.mjs` | Chromium geometry, interactions and screenshots at four requested sizes, plus keyboard-space simulation. |
| `.github/workflows/panda-reference-review.yml` | Run checks on the work branch, without deployment. |

## Old presentation layers

The page no longer loads `panda-live-v346.css` or `panda-live-v346.mjs`. The v337, v341 and v344 presentation modules were not active in the inspected page. No active v342/v343 presentation dependency was found. Files are retained for rollback. `PandaApprovedBridge337` remains an engine compatibility interface, not a visual layer. Knowledge modules and all MP3 files remain unchanged.

## Validation

- `npm run check:panda-screen`: 58 passing tests.
- Selected real-engine integration, mic recovery, Non-Stop, Brain and new view tests: 17 passing Node test entries; Brain test includes 106 deterministic assertions.
- JavaScript syntax and diff whitespace checks passed.
- Initial Chromium run found unbounded long history and an image-box ratio issue at reduced height; both were corrected.
- Chromium rerun at source commit `5374e4d46ae2a79e80c07a7b42dd99f461da823b`: 24 geometry checks passed at 360×760, 384×850, 400×800 and 430×930, plus 430px-high keyboard-space simulations. No page JavaScript errors. MP3 playback, modes, history, topics, speed, pinyin and mocked recognition passed.
- Screenshots were inspected: the background does not match the reference; the cutout has residual background at some edges; spacing and typography still differ. Visual acceptance failed.
- CI evidence: https://github.com/trommelschlager-ai/chinese-coach-pwa/actions/runs/43649197626 .
- Physical Android speech service, audio quality by listening, real Android IME, exact visual match, and final deployment are not verified.

The live Pages URL continues to serve the previous production version: https://trommelschlager-ai.github.io/chinese-coach-pwa/panda-voice-pilot.html .