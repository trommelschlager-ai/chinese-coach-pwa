# Panda Go · Offline Panda Memory v1 — staged foundation (2026-11-23)

**Status: code staged, not wired into the live Panda AI page.** No customer chat is collected and no data leaves this phone through this module. Existing Panda UI and Xiaoxiao clips remain unchanged.

## Goal

During online learning, Panda may suggest saving useful learner/assistant exchanges locally. After the learner explicitly opts in, pairs are staged on **this device only**. A human-reviewed sentence pair plus its approved Xiaoxiao MP3 can then be marked offline-ready. When no internet exists, the offline engine matches reviewed Chinese input text and the topic to the saved answer and plays the already downloaded audio.

**This is a searchable phrase/dialogue memory, not training/fine-tuning of a language model and not unrestricted offline AI.**

## Staged module

`assets/panda-offline-memory-v1.mjs` exports:
- `preparePandaMemoryCandidate()`: validate language, HSK1/2 level, length, topic; explicit consent is required; record status is `pending-review`, **never** automatically approved by an AI model;
- `createPandaMemoryStore()`: IndexedDB storage, scoped by owner and topic, with `stage()`, `approve()`, `recall()`, `delete()`, `clearOwner()`;
- `prepareReviewedPandaMemory()`: only accepts a distinct editorial approval reference, the authorized `approved-course-audio` source and a real, bounded `Blob` marked `voice-093`. The app integration must verify the corresponding approved registry entry before calling it; a caller-controlled approval flag is not a server-side proof;
- `fetchApprovedPandaMp3()`: accepts **only same-origin HTTPS MP3**, rejects redirects, opaque and wrong-format/oversize files. Dynamic temporary Luvvoice URLs cannot be treated as durable offline audio.

Status safety: staging an already approved phrase never overwrites its reviewed MP3.

## What will run when offline

- **Text-input** replies: yes, after the UI and data import are connected, for an exact saved phrase in a matching topic.
- **Xiaoxiao MP3**: yes, when the actual binary is saved to IndexedDB before going offline.
- **New AI-generated Mandarin**: no — requires a local model not provided here.
- **Microphone on Android without a network**: not guaranteed; the browser's speech recognition may require remote services, and the local Chinese ASR engine is a separate project.
- **Sharing learning across students**: not done. Each learner has an isolated per-device namespace. Common course packs need explicit editorial selection, copyright checks and signed update distribution; never publish private conversations into shared course assets.

## Next steps for real deployment

1. Add an opt-in `Сохранять фразы для офлайна` toggle in a **separate staging screen**, off by default.
2. When online LLM is actually enabled, stage utterance/answer/pinyin/Russian as `pending-review`. Show provenance and label automatically generated pinyin and translations as unreviewed.
3. Build an editorial review queue: check semantics, pinyin tones, Russian meaning and lack of personal information. Only then register a reviewed phrase/MP3 mapping.
4. Audio: save the **actual approved Xiaoxiao MP3 bytes** for each reviewed answer, not an expiring Luvvoice CDN URL. Verify Luvvoice terms for permanent offline use and the right to redistribute recordings as part of a general course.
5. Before internet-off test, download the offline shell plus approved packs, confirm IndexedDB persistence and storage space; request persistent storage where supported, and give learners a way to delete the data.
6. Test in Android airplane mode using text input first, then investigate and validate a true local Chinese ASR package for speech input.
7. Only after browser/Android tests, integrate `recall()` as an offline fallback in the existing Panda page without touching approved lesson content.

### Risks / limitations

- IndexedDB can be cleared by the user, browser eviction or reinstalling PWA; **not** a guaranteed backup. Offer import/export for user-approved lesson packs in a future milestone.
- This memory does not establish verified Mandarin tones from recognized speech.
- LLM answers and generated pinyin may be wrong. **Do not auto-promote all online chat** to trusted course content.
- If the user saves personal chats, those records must be separated from shared course packs, encrypted/sync controlled when applicable, and deletable at the learner's request.

## Tests

`node --test tests/panda-offline-memory-v1.test.mjs`

These tests validate consent, normalization, reviewed-audio restrictions, MP3 boundaries and rejection when IndexedDB is unavailable. A real mobile Chromium IndexedDB test and a physical Android airplane-mode test remain required before launch.
