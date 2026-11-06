# Panda Go — HSK 1, free two-voice audio production (preflight)

## Approved voice policy
- Narrator, every vocabulary entry, explanation, sample and self-practice phrase: one female Mandarin voice **`zf_xiaoxiao`**.
- In all seven dialogues: interlocutor **А** is one male Mandarin voice **`zm_yunjian`**, and interlocutor **Б** uses the *same* female voice `zf_xiaoxiao`.
- Candidates come from **hexgrad/Kokoro-82M**, whose code and checkpoint are offered under Apache 2.0. Verify LICENSE and actual model files before commercial launch. No paid inference services are required to run locally, but hardware and hosting may incur real costs.
- Do **not** synthesize four-tone assessment reference clips without native-language validation. Until then, keep the currently licensed same-speaker human recordings for the four-tones quiz.

## What is ready and what is not
- `scripts/hsk1_kokoro_audio_v155.py` generates a complete, deduplicated phrase-and-voice **review queue** from current HSK 1 curriculum.
- No generated voice recordings are bundled or published in this PR; current app audio and progress are unchanged.
- The initial voices are **candidates**, not a claim of native-level accuracy or a user's final aesthetic approval. Chinese proper names and third-tone sandhi need special manual attention.
- New audio must be approved and accurately mapped *before* replacing legacy MP3. Do not autoplay gender-mismatched old assets.
- For paid use, retain a license copy, model/version, source list, speaker assignment, generation logs and a QA sign-off.

## Steps to generate, with free local tools
1. `python3 scripts/hsk1_kokoro_audio_v155.py --plan` (stdlib only; creates `.voice-staging/hsk1-kokoro-v155/review-manifest.json`).
2. Install `ffmpeg`, then `pip install "kokoro>=0.9.4" "misaki[zh]>=0.9" soundfile numpy`.
3. `python3 scripts/hsk1_kokoro_audio_v155.py --render-samples` generates a small female/male A/B comparison to listen to.
4. Validate those files **by ear** (preferably with a native Mandarin speaker), checking syllables, tones, speed, noise, characters, and whether male and female voice timbres actually sound right.
5. Only after sign-off: `python3 scripts/hsk1_kokoro_audio_v155.py --render-all` to stage each unique female/male Mandarin phrase; then inspect all new recordings, map exact source strings to files and publish in a separately reviewed change.

## Explicit constraints
- The `--render-*` commands download model weights in the chosen local environment; no API key or per-generation subscription fee is needed, but the connection and CPU/RAM must be available. **No rendering job is triggered automatically by this PR**.
- Generated MP3 are staged in a gitignored directory and never automatically copied to public GitHub Pages.
- This does not implement automatic phonetic recognition or automatic tone scoring.
- On Android, audio should be tested with speaker on/off, headphones, airplane mode, and repeated transitions between steps.
