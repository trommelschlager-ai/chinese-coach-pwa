# Panda Go · Panda AI voice routing audit — 2026-11-22

## Approved distinction

- **Conversational Panda AI:** user-selected synthesized **Xiaoxiao (Female)**. The Luvvoice service's Xiaoxiao ID is `voice-093` (as used in `scripts/generate_panda_xiaoxiao_trainer.py`).
- **Panda Street AI:** separate user-approved male voice; **never** substitute it into conversational Panda AI.
- **Chinese native-speaker recordings:** **never** substitute them into conversational Panda AI.
- **Pronunciation trainer:** a separate Xiaoxiao corpus with `RATE=-20` and `trainerOnly=true`, not an automatic dialogue fallback.
- Earlier conversational Xiaoxiao settings were Mandarin, approximately −15% rate, pitch 0, volume 0. Compare the **actual currently approved Panda AI audio sample** before applying speed to new files; service settings and file names alone cannot establish exact acoustic equivalence.

## Actual live audio route

`panda-voice-pilot.html` → `panda-hsk2-preview-core-v1.mjs` / `panda-hsk2-preview-ui-v1.mjs` → `panda-hsk2-preview-audio-v1.mjs` → `lookupApprovedPandaVoice()` in `panda-approved-voice-registry-v516.mjs`.

The lookup prioritizes exact approved recordings from family, “My Day”, clarification, HSK1 conversation catalog, three context replies, then tightly scoped legacy Panda recordings and HSK2 audio packs. These source **directories contain recordings, not verified voice IDs**. `Luvvoice` is the provider name; it does not identify a male speaker or disprove Xiaoxiao. The manifests for November 20–22 archives specify Luvvoice source filenames and phrase mappings but **do not establish every MP3 was generated using voice-093**. The user previously confirmed compared existing recordings as the same approved voice; preserve them rather than replace on an unsupported guess.

A static code/registry audit shows no automatic route from `panda-xiaoxiao-trainer-v250`/Xiaoxiao lesson recordings, no Panda Street fallback, and no `speechSynthesis` route in active conversational modules. This is not a perceptual speaker-identity, tone, or listening audit; verify those acoustically.

## Five newly introduced replies: MP3 uploaded and exact route active (2026-11-22)

Source of truth: `assets/panda-ai-xiaoxiao-pending-20261122.json`, including source filenames, byte sizes, SHA-256 and Git blob SHA values.

1. 今天我有空，可以聊聊天。 — `panda01.mp3`
2. 好的，那你先忙吧。 — `panda02.mp3`
3. 那你今天想做什么？ — `panda03.mp3`
4. 那你想聊聊天吗？ — `panda04.mp3`
5. 你想聊聊工作吗？ — `panda05.mp3`

All five original user-supplied files are preserved in `assets/panda-ai-xiaoxiao-new-replies-20261122/`. The user-uploaded Chinese transcript matched the exact intended phrase for each clip; Git blobs match the original local file hashes byte-for-byte. MP3s decode at 24 kHz mono with no clipping. The live Panda AI registry now activates an exact matching MP3 for each full phrase; no fuzzy text reuse.

*This is an engineering integrity check, not human-certified tone accuracy or independent proof of a specific synthesizer voice ID.*

## Release verification

1. Run `node --test tests/panda-ai-xiaoxiao-voice-boundary-v1.test.mjs` and the isolated real-mobile Chromium text/audio regression.
2. Check visible `🔊` controls and real playback from each exact Panda response.
3. Keep the existing approved MP3 sources unchanged; optionally have a native speaker verify the two 聊聊 neutral tones.
4. Continue treating microphone/network failures as distinct from language-understanding bugs.

## Automated guard

`node --test tests/panda-ai-xiaoxiao-voice-boundary-v1.test.mjs` checks exact route isolation, absence of unauthorized TTS or lesson/human/Street substitution, and the exact five-file recorded-audio registry. It **does not prove** a voice's identity from MP3 waveforms.
