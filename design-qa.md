# Panda Go — lesson 4 v216 visual QA

final result: passed

Scope: responsive lesson UI and retained functionality. This does NOT certify native pronunciation, noise-free recordings or a fully completed audio task. Audio release gaps are listed in docs/lesson4-v216/audio-audit.md and recording-list.md.

Source visual truth: user upload ../upload/01-34174.png, 1404×1536. Durable copy: qa/lesson4-v216/approved-reference.webp. The reference contains eight illustrative phone views, not thirteen executable screens.
Implementation: qa/lesson4-v216/screen-01.jpg through screen-13.jpg. Captured real production HTML/JS in cloud Chromium, inside 390×844 CSS iframe, density 1. Full browser screenshots were cropped to the measured iframe rectangle (487,0)–(877,844). Source phone content is normalized to the same 390×844 excluding phone bezel and OS status bar.
Full-view evidence: qa/lesson4-v216/reference-comparison.jpg and all-13-screens.jpg. Focused checks used original 390px captures for Chinese/pinyin, weekday cards, Sunday pair, chat bubbles, buttons and result score; these remain legible at 1×.

Comparison history:
1. Removed duplicated focus-word cards, reduced study headings, moved long cover plan into a disclosure, added original calendar icons and logo. This restored the reference's list-card rhythm and visible mascot.
2. Removed accidental source count/calendar slivers from decorative crops. Enlarged dialogue text and placed exact source characters alongside the two speech bubbles. Removed repeated result headline; added persistent map navigation on result.
3. A first cover capture caught a previous compositor frame. Re-captured after DOM and image readiness observation. Verified 1/13–13/13 labels in the final image set.
4. Final reference comparison reviewed after these corrections. No UI blocking P0/P1/P2 issue remains within the 13-screen adaptation described below.

Required fidelity surfaces:
- Typography: original raster logo and artwork text preserved; real interface text uses system Cyrillic and CJK fallback. Chinese 25–32px on cards, pinyin readable with diacritics; larger chat translation than the original implementation. Exact source handwritten interface font is not available; this is an explicitly disclosed adaptation, not a pixel-copy claim.
- Layout: real 13-screen curriculum retained rather than flattening eight reference pictures. Weekdays split 3+3+Sunday; long grammar/dialogue content scrolls while footer remains reachable. At 320×693 and 430×931, all 13 app/stage widths fit the iframe and footer bottom equals viewport height. Machine evidence: qa/lesson4-v216/mobile-{320,430}.json. Final icon rows additionally rechecked at narrow width.
- Colors: cream/peach backgrounds, gold borders, fuchsia buttons with soft glow, green progress and correct-answer states. No lavender scene or straw-hat/backpack mascot.
- Images: exact source crops for headphone panda, graduation panda, sakura, logo, calendar icons and dialogue characters. No alternate generated art, whole-screen click overlay or re-created phone chrome. Source raster resolution is 323px for hero; scaling is modest and disclosed.
- Copy: 星期 + 1–6, Sunday synonyms, 二 fourth tone, 今天/明天/昨天, practical phrases with accurate pinyin and translations. Literal source sketch typo-like 今天是星期三 pinyin mismatch is not copied; course sentences and romanization correspond.

Primary interaction validation: DOM regression traverses all 13 screens, MP3 end gating, errors, locked exam replay, calendar wrap, handwriting callbacks, one-voice chat sequencing, sentence building, 8/10 score, targeted retake, restart and preserved/resumed existing progress. Cloud browser checked every screen, visible loading, responsive bounds, native MP3 playback and navigation (live verification documented separately in final handoff).
Console: application JS errors not found in captured browser logs; extension metadata errors excluded by source URL. Full repository checks return 0 with known legacy jsdom warnings outside lesson 4. Microphone hardware and actual Android are not certified.

Remaining adaptations, disclosed: responsive/system typography, larger scrolling explanations and preserved 13-step pacing; source has eight example views only. P3: higher-resolution original art would improve larger-screen sharpness. Audio is an explicitly open task: 13 spliced references and 5 missing phrases require 18 complete recordings and native listening review. No random TTS substitute is present.

Published verification: all 13 screens traversed on GitHub Pages in 390×844 iframe; actual MP3 completion gates, writing demo, dialogue answer flow, sentence composition, 8/10 intentional-error exam, targeted retry preserving score, and map completion verified. Evidence: docs/lesson4-v216/live-verification.json and qa/lesson4-v216/published-cover.jpg. The initial CI cache-version assertion was updated to compare SW and offline manifest semantically; full local checks pass again. Native audio sign-off remains open.
