# Panda AI: seating and audio diagnosis, 15 November 2026

Base: `ebc68f6c5556a3553779c6af86892af556b7c6db`.
Backup: `backup/panda-seat-audio-20261115`.

## Confirmed code defects

1. Both main and history players previously called `play()` on a long recording while muted, then unmuted only if a seek event arrived within 0.13 seconds of the desired start. Playback continued during that check. A delayed event could leave `muted=true` for the entire phrase; there was no recovery or timeout. The two independently implemented players also duplicated cancellation logic.
2. History playback stopped the main audio but did not abort active speech recognition or pending follow-up replies. An automatic follow-up could interrupt or overlap history playback.
3. The service worker attempted `Cache.put()` for every successful HTTP response. A partial MP3 response (206) is successful but cannot be stored by Cache.put; the rejected promise could fail an intercepted media request. Range requests now pass directly to the browser; only full 200 responses are cached.

## Changes

- `assets/panda-live-audio.mjs`, `panda-voice-clips-v365.{mjs,json}` and 155 MP3 files: exact source ranges from the existing index become standalone recordings. No synthesis or replacement phrase. Original source MP3 files and index remain intact. Index lookups start at zero and use the native ended event instead of timeupdate clipping.
- `assets/panda-live-screen-v270.mjs`: no muted seek path; shared main/history playback, stale-event cancellation, explicit volume and mute reset.
- `assets/panda-live-v346.mjs`: history delegates to that same player. Conversation engine and knowledge modules unchanged.
- `assets/panda-live-contact-v365.css`: fixed body; feet align with the existing stone's top face; contact shadow is anchored to the feet. Character image, proportions, face canvas, headset effects, blinking, sakura and landscape remain unchanged.
- `panda-voice-pilot.html`, `sw.js`, `assets/offline-pack.json`: versioned loading, offline inventory and media-cache handling.
- Build, audit and regression scripts, tests and CI workflow accompany the change.

## Local verification

- 70 automated tests passed, zero failures (`npm run check:panda-screen`).
- HSK2 bridge and sentence coach verification passed.
- 390 exact phrase mappings, 388 unique available MP3 files.
- All 388 files fully decoded by FFmpeg without decoding errors; non-silent RMS and peak verified. Total decoded duration: 519.9 seconds.
- All 155 indexed ranges fall within their original recording's duration.
- All generated clips have first/last 40 ms below -35 dBFS. This is a technical boundary check, not a transcript certification.
- Dedicated regression checks: every indexed phrase starts unmuted at zero; history/main cancellation; stale callbacks; 0.8x/1x; microphone cancellation; repeat after stop; service worker bypass for Range.

## Limits and publication gate

Physical Android Chrome, actual microphone recognition, screen locking and device audio output are not available in this environment. Chromium's mobile viewport is not a physical Android test. Full phrase-by-phrase listening/transcript and tone validation has not been completed; v332 itself describes its source alignments as candidates. No claim that all possible audio problems are solved follows from technical checks alone.

Browser playback, responsive screenshots and publication status are recorded after the branch CI finishes. The production branch must remain unchanged until the required browser checks pass and the screenshots have been reviewed.
