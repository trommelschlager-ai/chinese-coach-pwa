# Panda Memory · Android preview v1 — 2026-11-23

## Status

Independent UI at `panda-memory-preview.html`. This is **not** embedded in the existing conversational Panda AI, and it does **not** record arbitrary live conversation. It demonstrates how an approved Mandarin phrase pair + full Xiaoxiao MP3 bytes can be saved to IndexedDB and reused in airplane mode. No paid AI, speech synthesis, or credentials required for this test.

## Three real reviewed demo pairs

| Chinese trigger | Offline Panda answer | Approved MP3 |
|---|---|---|
| 我想看喜剧片。 | 我喜欢喜剧片。 | `./assets/panda-context-voice-20261122/chat03.mp3` |
| 你为什么喜欢喜剧片？ | 因为喜剧片很好笑。 | `./assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3` |
| 今天我休息。 | 那你今天想做什么？ | `./assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3` |

All demo texts, pinyin and Russian meanings are in `assets/panda-memory-reviewed-samples-v1.mjs`. These exact answers have been previously reviewed with the user. The preview never treats arbitrary LLM output as approved and does not have any AI provider connection.

## How to test on Android

1. Connect to internet and open `https://trommelschlager-ai.github.io/chinese-coach-pwa/panda-memory-preview.html`.
2. Choose a demo pair. **Check the opt-in consent** to store that course example on the device.
3. Tap **Сохранить с Xiaoxiao**. Wait for «Сохранено ... MP3».
4. Tap **Подготовить офлайн**. This registers the existing service worker and caches the preview HTML and its two modules (the actual MP3 is already in IndexedDB).
5. Enable airplane mode. Keep the page open, or reopen it after it has been prepared online. Tap **Проверить память** using the Chinese text in the box.
6. Tap **Слушать Xiaoxiao**. This plays the previously downloaded MP3 Blob, without contacting Luvvoice or network.
7. Test **Удалить эту фразу** or **Удалить всю тестовую память**. Those controls delete local data. The delete action is not a server deletion because no server copy exists.

## Offline limits

- Matching is exact after trimming Chinese punctuation and whitespace, scoped to a topic. It does not understand new unseen sentences.
- **Keyboard/text** works offline. The microphone is NOT used; Android Chrome Web SpeechRecognition may require network. A local Chinese ASR would be a later, separate feature.
- It does not use a language model offline and it does not transfer private learners' chat to the shared course.
- MP3 playback is possible only after the binary was downloaded while online. Expiring Luvvoice API URLs are rejected by the storage helper.
- Cache/IndexedDB may be cleared by storage pressure, browser cleanup or reinstall. A full lesson-pack backup/export and per-account storage policy are separate milestones.
- In the preview, the opt-in is not stored as a global preference; it starts **off on each new page load** and applies to the chosen demo only. Local data in the demo is isolated in the `panda-preview-local` namespace.
- This is a demonstration of user-approved course content, not server-verified editorial approval. Production shared course imports must authenticate and verify provenance in a protected publishing process.

## Automated checks

CI workflow `.github/workflows/panda-offline-memory-v1.yml` runs existing unit tests and a real mobile Chromium offline-reload UI scenario. The UI scenario uses the approved course MP3 bytes from the checked-out repo, intercepts only the external URL for dev HTTP testing, and verifies the browser can cache the preview page, retain and play the MP3 in offline mode, then delete the record.

**Do not add automatic online-AI capture to the main Panda until an opt-in per-learner workflow, teacher review queue, storage quotas, rights checks, and robust Android airplane-mode QA are completed.**
