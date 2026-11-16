# Panda Go v394 — approved mobile artwork

Backup: branch `backup/panda-before-v394-20261116`, original commit `3dcc32dad7ce0a22e822e90685e889e5bbf09245`. Local originals also saved before editing under backups/v394.

Changes: Bastian uses contiguous original-image regions 0–820 and 820–1536, with original semantic audio and practice controls. Map fits its actual 941×1672 ratio within the available viewport. The daily lesson reuses the approved scenic header and retains words, grammar, quizzes and speech practice. The removed training menu redirects old routes to home; exercise implementations and data remain. Shared pressed states use a 2px shift, brightness and soft rounded shadows. HSK1 lesson pages load the same pressed-state stylesheet. PWA cache updated to v394.

Validation: 5 Node/DOM suites passed, including all 30 course mini-lessons, 60 quizzes, 30 builders, final exam and local storage; Bastian phrase/term playback dispatch, transitions into practice; map aspect-ratio calculations at 360×640, 393×600, 393×760 and 412×840; all service-worker shell paths exist. Original approved image and MP3 files are unchanged.

Limits: these viewport checks are geometry calculations in jsdom, not browser screenshots. Local Chromium failed to start because sockets are restricted. Cloud Browser could not access the local preview (bearer token error). No physical Android device or Android emulator was available; Android Chrome rendering, real audio playback and pressed-state appearance remain unverified. No successful Android test is claimed.

Additional HSK1 native-audio source audit passed (8/8 phrases). Two legacy checks fail on both the original HEAD and this change: verify-hsk1-second-v203.cjs expects an obsolete literal map attribute order, and verify-offline.cjs imposes a shell count of <=170 that the existing release already exceeds. They are recorded as baseline failures, not successful checks.

Final rendered-browser verification: GitHub Actions run https://github.com/trommelschlager-ai/chinese-coach-pwa/actions/runs/43793426567 passed on commit 1b8c86d10ed1fe7eb8c580058daf99c8510ac346. Chromium mobile emulation at 360×800, 393×852 and 412×915 checks complete map hotspot visibility, artwork aspect ratio, all three day mini-lessons, Bastian pages and illustrated practice button, and the legacy training redirect. Screenshots are attached to that run. This supersedes the initial local-preview limitation above; no physical Android test is claimed. Live public pages were also inspected in Cloud Chrome.
