# Panda Go v322 — one Panda, two-layer conversation engine (experimental)

## Objective
Keep the approved Panda Go home, mascot, seven HSK1 lessons, consent-based Chrome voice recognition and all previously approved human MP3 files unchanged. Improve Panda AI via an **optional** on-device language model for questions that the deterministic HSK1 brain explicitly cannot answer. No paid server or API keys.

## Architecture
1. **Verified-first:** `answerLive` still handles all known questions, corrections, word cards, lessons and approved follow-ups. Errors and safety conditions never route to a generative model.
2. **Opt-in local fallback:** `shouldRouteToLocalAi` only accepts a `clarify` reply with no verified correction/reply. By default the model is absent and no download is triggered.
3. **Local model:** WebLLM v0.2.86 in a Web Worker, model `Qwen2.5-0.5B-Instruct-q4f16_1-MLC`, only when the user explicitly opens “Подсказки и новые слова” → “🧠 Локальный AI — эксперимент” → “Проверить телефон и загрузить AI”.
4. **Presentation:** Generated answer is always labelled experimental, rendered as **text only**, no fabricated audio, pinyin or pronunciation/tones score. Reject missing/invalid JSON and retain normal Panda fallback. First-run downloads can be large (hundreds of MB), require WebGPU and sufficient device memory/storage. Normal Chinese conversations stay functional when unsupported or disabled.
5. **Safety/UX:** No web-server inference request. Chrome SpeechRecognition remains a separate browser feature which *may* use external speech services. Existing audio data and user progress are not modified; model is not auto-cached by the PWA shell.
6. **Rollback:** Turn it off in the same study dialog; the current worker is terminated. Reload uses the stable Panda Brain by default. All model answers are treated as unverified teaching suggestions until checked by a native speaker.

## Validation
- `node --test tests/panda-local-ai-v322.test.mjs` covers capability gates, verified-first routing, bounded HSK prompts, output validation, no invented audio/tones, worker opt-in and fail-safe stop.
- Existing `npm run check:panda-screen`, `npm run check` and course QA must pass unchanged.
- **Manual gate before enabling for general users:** Chrome Android real-device test for GPU availability, first download/data size, memory, responsiveness, text and microphone, no stale PWA cache, model accuracy on at least 50 curated HSK1 prompts. Test weak hardware and in-app browsers. No automated test proves GPU/runtime loads on every device.

## Limits / future acceptance criteria
This is NOT yet a full unlimited **voice** AI. There are no new validated human MP3s for arbitrary generated output; generated Chinese and Russian are not academically verified. True tone checking needs independent acoustic analysis; browser speech transcription does not measure tone accuracy. If device GPUs cannot run the model reliably, use the existing free deterministic teacher or investigate another offline backend. Do not monetize HSK2 access via client-side gating alone.
