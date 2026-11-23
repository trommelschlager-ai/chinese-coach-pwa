# Panda Go HSK2 themed footer — isolated layout check (23 Nov 2026)

A local HTML/CSS mock of the PR #177 approved-cover layout was rendered with
actual `lesson-01-scene.webp` and a 941×1672 full-cover Panda Go illustration.
This is a **layout smoke test only**, **not a real Android device test** and **not
a pass of the app's audio, navigation, persistence or other pages**.

| Simulated Chromium viewport | Overlay fill | Vertical scroll | Start hotspot |
|---|---|---|---|
| 360×800 | occupies viewport height | none | click registered |
| 393×873 | occupies viewport height | none | click registered |
| 412×915 | occupies viewport height | none | click registered |

Both top and bottom edge pixels are colored; no entirely blank white bands
were found in the mock. The scene uses a fitted full-width background with
feathered top and bottom. Visual quality must still be reviewed in real app.

**Remaining blockers:** binary `lesson-01-scene.webp` through
`lesson-10-scene.webp` are absent from GitHub PR #177; the GitHub Action
`hsk2-thematic-scenes.yml` intentionally fails until all 10 assets match
manifest SHA256 checksums. Then check the actual site on Android Chrome at the
same three sizes and all ten lessons. Never merge merely based on this mock.
