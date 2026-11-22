# Panda AI v514 — staged, not deployed

Archive: Panda_AI_HSK1_20_MP3.zip. All 20 local MP3 SHA-256 hashes verified against the archive manifest; original input hash verified. The connector cannot transfer the local binary files. Do not activate the staged registry before uploading and verifying all 20 MP3s.

1. Upload archive contents except README into `assets/panda-hsk1-catalog-voice-20261122/`.
2. Verify SHA-256 of every file against manifest.json and the staged registry.
3. Change registry imports in `assets/panda-hsk2-preview-audio-v1.mjs` and `assets/panda-hsk2-my-day-scenario-v1.mjs` from v513 to v514. Update module/cache versions consistently on main and preview pages and service worker; preserve other code and all prior audio.
4. Verify exact question mappings and 112/112 catalog candidates. Verify playback on Android separately. No alternative voice, TTS or native-speaker recordings.

Expected after verified upload: 528 unique registered phrases (previously 508); 112/112 exact catalogue questions. No claim of deployed coverage until verified.
