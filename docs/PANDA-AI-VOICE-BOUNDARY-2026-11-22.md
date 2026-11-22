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

## Five newly introduced replies: still missing

Machine-readable recording queue: `assets/panda-ai-xiaoxiao-pending-20261122.json`.

1. 今天我有空，可以聊聊天。 — Jīntiān wǒ yǒu kòng, kěyǐ liáoliao tiān.
2. 好的，那你先忙吧。 — Hǎo de, nà nǐ xiān máng ba.
3. 那你今天想做什么？ — Nà nǐ jīntiān xiǎng zuò shénme?
4. 那你想聊聊天吗？ — Nà nǐ xiǎng liáoliao tiān ma?
5. 你想聊聊工作吗？ — Nǐ xiǎng liáoliao gōngzuò ma?

The second 聊 in reduplicated 聊聊 is a neutral tone in these learning transcriptions. New phrases must remain **text only** until separately recorded exact MP3s have been listened to and approved. Do not create a voice using the male Street preset or browser TTS.

## Safe next release gate

1. Generate five individual full-phrase files with the **same confirmed Xiaoxiao voice settings** as current approved Panda AI, not automatically copied from the trainer.
2. Compare all five with one approved conversational reference for vocal timbre, speed, tone, audible tails and start/end silence.
3. Only after approval, register exact phrase-to-file paths in `lookupApprovedPandaVoice` and validate all five in Android Chrome.
4. Keep all existing approved MP3s unchanged. Continue separating microphone/network faults from language errors.

## Automated guard

`node --test tests/panda-ai-xiaoxiao-voice-boundary-v1.test.mjs` checks exact route isolation, absence of unauthorized TTS or lesson/human/Street substitution, and the explicit five-file missing-audio queue. It **does not prove** a voice's identity from MP3 waveforms.
