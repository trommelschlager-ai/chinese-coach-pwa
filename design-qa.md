# Panda Go v175 — two-screen reference implementation

final result: passed

## Visual truth and normalization

User attachments: `02-33887.jpg` is the approved home, `01-33888.jpg` is the approved mountain map; the other two images show the rejected live design. Compared only app content, excluding Android/iPhone status bars and phone frames.

Source home: 694×1536, app crop (34,184)–(600,1398). Source map: 694×1536, app crop (51,199)–(603,1381). Normalized comparisons are 390×844; screenshots use actual CSS iframe viewports inside the cloud Chromium browser. Screenshot density: 1 image pixel per CSS pixel. Iframes contain the actual production pages; no alternate application is used.

Evidence: `qa/v175/home-{320,360,390,430}.jpg`, `qa/v175/map-{320,360,390,430}.jpg`, `qa/v175/compare-home.jpg`, `qa/v175/compare-map.jpg`, `qa/v175/responsive.json`. Viewports: 320×693, 360×779, 390×844, 430×931. These are responsive browser checks, not physical Android device testing.

## Comparison history

1. Initial rendered home had a large blank area caused by legacy v151 styles. Removed superseded two-screen stylesheet imports, keeping lesson pages and their styles intact. Confirmed continuous hero → six buttons → bridge in recaptured home.
2. Preview service worker cached Vite CSS transform output after edits. Replaced development server with a static production-file server and excluded local preview requests from SW interception. Hard reloaded and confirmed actual CSS rendering. Production cache and media migration retained.
3. Map initially omitted the reference laurel marks and positioned its title too low. Extracted decorative laurels from supplied art, moved title up and removed the extra back-button disc. Final map captures show the corrected header.

## Required fidelity surfaces

- Typography: home text remains part of each supplied individual artwork skin, with accessible semantic names on each separate control. Map uses bold dark-purple live text and two-line lesson labels. Existing longer curriculum titles require smaller type than the mock's shorter titles.
- Layout: six independent home controls; seven map links placed bottom-to-top along stone stairs; explorer at bottom left. No horizontal overflow at the four tested widths. Map hit targets are at least 44px tall at 320px. Images retain intrinsic aspect ratio; short screens can scroll.
- Color: supplied glossy pink/cyan/purple/mint card art, gold borders, purple heading, pink lesson pills, green current lesson and grey locked state.
- Art: exact supplied home hero, six separately extracted button skins and bridge; newly generated raster mountain/staircase/traveler background. No whole-screen screenshot click overlay, flat road, drawn SVG staircase or flat HSK icons. Map locks and laurels are raster assets from the supplied reference.
- Content: real seven current course names and original lesson IDs retained. Mock names and fake completion checkmark were intentionally not copied.

## Functional and regression checks

Browser: HSK1 home link → actual map; first lesson → actual lesson with all seven steps and voice controls; lesson Back → map → home; HSK2 button announces that the course is being prepared. Locked links are aria-disabled; navigation prevention is covered by DOM regression tests. Console checked: extension metadata errors only, no application JavaScript errors observed.

`npm run check` and `npm run check:release`: passed. Historical art/version assertions were updated to current assets; lesson/audio checks retained. Added v175 scenarios for fresh state, completed first lesson, out-of-order completed lesson, isolated topic completion, malformed saved data, blocked future navigation and unchanged localStorage. 131-file install budget and full offline retry/migration checks passed.

No MP3s, voice maps, speech recognition, exercises or saved-progress keys changed. Source diff confirms lesson runtime/data/audio files untouched.

## Remaining differences

The generated landscape preserves subjects and composition but is not a pixel-identical reconstruction: rock shapes, stair turns, flowers and panda pose differ. The map uses actual course titles and actual stored lock/completion states, unlike the illustrative mock. Home artwork quality is limited by the supplied 694px-wide reference, so it cannot be represented as original vector/high-resolution source art. These limits are explicitly disclosed, not claimed as exact identity.

Focused comparison: home HSK1–6 artwork and map header/cards are readable in the 390px side-by-side captures. No unresolved blocking layout, interaction or missing-asset issues.
