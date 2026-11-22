# Panda Go / HSK 2 / visual consolidation (22 Nov 2026)

## Reference sources
- Cover: user-provided 38221.jpg — existing lesson 1 "О себе". **Never modify lesson 1 cover.**
- Inside pages: user-provided 38225.mp4, lesson 7 "Мои планы на будущее": purple selected tabs, green audio, purple microphone, sakura/lake background, white gradient cards, compact Android header/footer.

## Implementation in this branch
- Original lesson 1 cover retained without modification.
- Lessons 2–10: one native HTML cover component, consistent 905:1737-inspired dimensions and master CSS; six interactive section buttons, one CTA, progress and banner, consistent gold borders and lilac/purple gradients.
- All 10 lessons: final interior stylesheet matching the reference lesson 7.
- Nine separate scene-only 3D illustrations are now committed under `assets/hsk2-reference-scenes-20261122/lesson-{2..10}.svg`, each with a locally embedded WebP source; this prevents old poster lettering from appearing behind the HTML copy.
- 3D illustrated section icons are sourced from the already installed `hsk2-lesson8-shop-icons-v3.webp` sprite; illustrations remain existing high-resolution assets, rendered with `object-fit:cover` for scenes and `contain` for teaching illustrations — **no nonuniform image stretch**.
- Audio, voice mapping, microphoning/ASR, exercise content, progress state, routing and lock logic deliberately not changed.
- The main branch and public website are unchanged; all changes live on `hsk2-reference-audit-20261122`.

## Lesson inventory
| Lesson | Source | Cover status | Study tasks described in source |
| --- | --- | --- | --- |
| 1 О себе | `hsk2-about-me.html` | Original approved visual | 6 expressions x 5 test types |
| 2 Мой день | `hsk2-lesson1.html` | Unified | 6 expressions x 5 types |
| 3 Работа и учёба | `hsk2-lesson3-work-study-preview.html` | Unified | 6 expressions x 5 types |
| 4 Хобби | `hsk2-lesson4-hobby-preview.html` | Unified | 8 expressions x 5 types |
| 5 Друзья и встречи | `hsk2-lesson5-friends-v2.html` | Unified | 8 expressions x 5 types |
| 6 Вчера и опыт | `hsk2-lesson6-yesterday-preview.html` | Unified | 8 expressions x 5 types |
| 7 Мои планы | `hsk2-lesson7-future-preview.html` | Unified | 8 expressions x 5 types |
| 8 В магазине | `hsk2-lesson8-shop-preview.html` | Unified | 8 expressions x 5 types |
| 9 Здоровье | `hsk2-lesson9-health-preview.html` | Unified | 8 expressions x 5 types |
| 10 Отношения | `hsk2-lesson10-relationships-preview.html` | Unified | 8 expressions x 5 types |

## Static checks already completed
- Ten of ten HTML pages: inline scripts parse in JavaScript, no syntax errors.
- Reusable cover JS: syntax valid.
- Three shared style files have balanced curly braces.
- All cover art paths and icon sources exist in the repository.
- All nine replacement covers call a single shared cover renderer.
- Ten of ten lessons load the final interior CSS file.

## Mandatory browser QA BEFORE merging to main
1. At 360x800, 393x873 and the reference screenshot's portrait dimensions, compare all 10 cover headers, framing, tiles, buttons and scroll to the approved lesson 1 image. Verify no text clip, image blur, blank header band or scrollbar.
2. Open **every** lesson's six content sections and test each step (8 stages). Compare all headers, selected tabs, lower navigation and card outlines against video 38225.mp4.
3. Verify each of 370 specified exercises can be reached: 30 each for lessons 1–3, 40 each for lessons 4–10. Counted from data construction; NOT yet individually run.
4. Test green audio controls, female-voice exclusion where required by the audio project, microphone start/stop, feedback and pronunciation on Android Chrome. **Not** tested in this branch.
5. Check all image edges, scene-crop composition and 3D sharpness: especially source posters for lessons 2, 3, 6, 7, 9 where original artwork may contain baked-in typography in the crop.
6. Verify locked states, saved progress, disabled buttons, no unwanted pan/zoom, and return navigation.
7. Only merge after browser QA or screenshot evidence.

## Known limitations
- Nine individual theme scenes are integrated, but their original source dimensions are **512×341 px**; they should be reviewed at high device pixel ratios before claiming HD quality, and they do not guarantee a pixel-identical reproduction of the approved first cover.
- CSS refactoring is deployed only in the separate test branch, and has not been screenshot-compared in a working Android browser yet.
- Automated Chromium smoke tests have passed **30/30** checks (10 lessons × 3 viewports) for opening the cover, loading art, entering the vocabulary step, displaying 5 tabs and footer, and no page errors. This is **not** a comprehensive test of all lesson stages, microphone hardware or tone quality.
- Screenshot inspections found duplicate poster lettering and plain lower backgrounds in the first attempt; these were corrected with scene-only art and a lakeside garden footer. Subsequent screenshots require final visual review.
- This remains a production-candidate **visual master**, not a final pixel-perfect sign-off.
