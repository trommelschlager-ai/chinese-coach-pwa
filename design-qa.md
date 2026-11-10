# Panda Go lessons 5–7 — v233 design QA

final result: passed

## Source and scope

Visual truth: the three approved image-gen-1/2/3 mockups from 10 November 2026, 1086×1448 pixels each. They depict lessons 5 (calendar), 6 (family portrait), and 7 (umbrella/weather). The incorrectly named `PandaGo_approved_L5_no_date.png` is a weather board with a blurred region; it was excluded.

Implemented application routes: `hsk1-fifth-v227.html`, `hsk1-family-v231.html`, `hsk1-weather-v231.html`. Existing 14-step curriculum and original storage keys are retained.

Browser evidence: `qa/v233/screens.zip` contains 42 actual browser captures, each cropped to the application viewport, 393×852 CSS/pixel dimensions at density 1. `qa/v233/PandaGo_v233_live_covers.jpg` combines the three live covers. The three `lesson*-comparison.jpg` images place reference and running cover/vocabulary states in the same image. This is browser-rendered HTML, not a generated UI mockup.

Reference phone chrome was cropped; source app regions are approximately 352×559 px. Each source crop retains its aspect ratio in the comparison board. The implemented Android-sized viewport is taller. Extra vertical room and bottom-anchored controls are expected; source and application heights must not be treated as identical. Full mockup boards include four sample screens, not 14 distinct screen specifications. The remaining screens use those same components while preserving the existing course structure.

## Findings and comparison history

1. P1, original version: flat SVG pandas, repeated side-by-side cover compositions, muted buttons and generic vocabulary. Fixed by replacing the entire isolated stylesheet and adding reference-based raster scenes, relatives, weather artwork, sakura decoration, coach characters and bright glossy controls.
2. P2, first implementation: the header pointed to a screenshot mosaic. Fixed with a separate transparent panda-face logo. Final captures show only the face.
3. P2, first implementation: ordinary system CJK fallbacks produced inconsistent glyph weights. Fixed with a locally bundled, licensed Noto Sans CJK SC subset; font synthesis allows readable bold glyphs. Text stays live and selectable.
4. P2, first implementation: cropped cover ribbons repeated below activities and arbitrary pictorial matches. Removed the ribbons, added small isolated coach characters to activities and illustrated dialogue bubbles. Family function words and weather/season terms now have semantic symbols.
5. P2, cover typography was too small relative to the reference. Enlarged the display title, kept the two-line calendar heading, and enlarged thematic word artwork. Recaptured the affected cover/vocabulary states.

Post-fix evidence: the three comparison boards; all 42 screenshots in `screens.zip`. No remaining actionable P0/P1/P2 visual issues were found in this scope.

## Required fidelity surfaces

- Typography: large purple display titles, clear bold Chinese words, tone marks preserved, readable pinyin/Russian. Live text is retained. The original course wording, ordering, vocabulary and instructions intentionally override wording/order in the illustrative mockups, as required by the user.
- Layout: centered cover copy over a full-width thematic scene; family vocabulary in illustrated horizontal rows; months/weather in paired cards; illustrated alternating dialogue bubbles; fixed bottom navigation and scrollable content. Tested at 360×800, 393×852 and 412×915. No horizontal overflow or hidden footer controls in 126 screen/viewport combinations.
- Color/tokens: light lilac/pink surfaces, deep purple text, pink glossy primary actions and circular pink audio buttons; themed lesson artwork follows the approved boards.
- Image quality: separate text-free 3D panda illustrations, consistent pink headphones, calendar with no date, family portrait, umbrella/clouds/rain/sun, relative/weather sprites. No smear overlays or blur filters. WebP assets are optimized for mobile display.
- Copy/content: baseline/current comparison of all 42 screens confirms identical educational text, audio button targets/roles/availability and serialized study state. Existing achievement/progress keys are unchanged. No audio file was modified.

## Functionality and verification

Passed:

- `node scripts/verify-hsk1-fifth-v227.cjs`
- `node scripts/verify-panda-go-approved-v231.cjs`
- `node scripts/verify-lessons-preserved-v233.cjs` — 42 screens, 98 enabled audio buttons, all original files exist, zero unavailable buttons, curriculum and saved state equal to baseline.
- `node scripts/verify-offline.cjs` — 141 shell resources; original download/retry behavior retained, updated release resources added to optional download inventory.
- Real browser: lesson start/next, original audio playback entered busy state, reload restored the study screen, weather listening answers unlocked the next step, three builder exercises unlocked handwriting, handwriting animation launched.
- Browser error logs: no application-origin console errors in inspected lesson tabs. Extension-origin browser infrastructure messages were excluded.
- `git diff --check`

Physical Android microphone capture was not tested. Browser viewport QA covers mobile layout; it is not a physical-device hardware test. Voice recordings are byte-for-byte unchanged.

## Follow-up polish

P3: Individual raster drawings are faithful recreations, not literal pixel extracts from the mockup board. The reference's family vocabulary illustration uses a younger sister while this course's first group contains the older sister; the existing lesson text was preserved. The taller Android viewport contains more breathing room than the short phone frames in the boards.
