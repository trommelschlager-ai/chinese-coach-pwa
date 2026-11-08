# Panda Go HSK1 v197 — Android audio repair (2026-11-08)
## Changed
- Approved female native recordings from the user remain the first priority.
- Where an isolated approved clip is missing, use a pre-existing licensed *human* recording before old robotic/synthetic MP3.
- On failure to load an audio source, try the next available recording automatically.
- Voice recorder requests microphone auto-gain, noise reduction, echo cancellation with a safe fallback.
- After capture, process the user's own recording locally using decoded samples, active-speech loudness measurement and capped gain (up to 12x, peak below 0.92), converting to a 16-bit WAV for immediate playback.
- No upload or network transmission of microphone audio. Sound is cleared on leaving the exercise.
- Approved visuals and lesson order unchanged, existing progress retained.
## Remaining
- The three isolated words 我, 是, 学生 still lack verified individual clips from the user's preferred female speaker. They now use a second licensed natural voice instead of synthesized audio, which is an improvement but not yet a fully unified voice.
- The real Android listening experience must be assessed on-device, not inferred from source QA.
- If decoding compressed mobile audio fails, the original recording remains available.
