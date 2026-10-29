# Usability simplification — v52

Implemented the 29 October 2026 usability audit in the application.

- Kept the approved cover image byte-for-byte, Start-only petals, six entry cards and writing in position three.
- Removed tool numbering, duplicate global navigation, decorative images behind learning text and repeated lesson counters.
- Fixed the lesson return action to reopen course, vocabulary or dialogue topics as appropriate.
- Collapsed speech recording and checking; distinguished approximate tone-contour checks from recognition of words.
- Added recall before vocabulary self-assessment, including a repeat-again path that updates the shared dictionary and review queue.
- Displayed complete A/B dialogues with selectable, playable turns and whole-dialogue highlighting.
- Moved writing help, character selection and voice settings behind disclosure controls; resize now updates the writing canvas dimensions.
- Updated service worker and asset versions to v52.

Validation: `npm run check` passes all six suites, including 20 lesson panels, 35 course questions and 140 answer choices; content and protected image checks pass. Integration checks cover return destinations, resume, browser Back, recall scheduling, dialogue controls, writing completion, wrong answers, offline caching and recovery after one optional download fails.

Browser layout checks used iframe viewports of 320, 360, 390 and 430 px. Vocabulary and writing layouts have no horizontal overflow. This is responsive browser testing, not testing on a physical Android device. Real microphone capture, acoustic accuracy of tone grading, screen-reader behavior and handwriting with a finger remain device checks. The existing mixture of local word recordings and device speech for other phrases remains; this release does not claim a newly recorded full-course voice package.
