# Panda AI — Android microphone and Mandarin tone acceptance (23 Nov 2026)

**Scope:** PR #197 conversation fixes. HSK2 lesson-3 acoustic quality gate is in **separate draft PR #187**; do not claim it is deployed on the public site.

## Release gate
Do not merge or announce Android voice/tone readiness until (1) required CI checks pass, (2) the **same candidate commit** is served from an accessible preview, and (3) a human test on a real Android handset has been recorded. An automated Chromium test or synthetic F0 data is not a substitute for a phone microphone test.

## Device / session
Record handset model, Android version, Chrome version, preview URL, PR head SHA, online/offline mode, screen viewport (360 / 393 / 412 CSS px), start date/time, audio output device, and whether the mic permission was granted.

## Panda AI speech recognition acceptance
1. Open **the PR #197 preview**, not production GitHub Pages. Start Panda AI in Chrome over HTTPS, enable the browser permission dialog, and speak **我不喝茶** (Wǒ bù hē chá, 'I don't drink tea').
2. Before pressing ➤, the recognized text must remain editable. **No chat turn, learning progress or Panda response may advance automatically**, even when browser ASR reports high confidence.
3. Change an incorrectly recognized string, then press ➤ once. Check that the dialogue reflects the edited text rather than the original ASR candidate.
4. Try **不好**, **没空**, **我不会说中文**, **我不想聊天** and **跑步怎么样**. Confirm contextual replies, visible pinyin and Russian translations, and no false interpretation of a negative answer as agreement.
5. Deny microphone access, retry, test no speech, interrupt a recording, switch to background and back, and test unavailable speech service. The button must recover and the text input must remain usable.
6. When a Panda reply has no approved exact MP3, it must remain **text-only**. No system TTS or substituted speaker.
7. If testing offline, text/offline resources can work only when previously cached; do **not** expect Android Chrome Web Speech Recognition to work offline.

## Mandarin acoustic tone check (separate PR #187 / isolated tone lab)
- With phone mic permission, capture reference/learner samples at normal speaking volume for **mā 妈 (tone 1)**, **má 麻 (tone 2)**, **mǎ 马 (tone 3)**, **mà 骂 (tone 4)**. Use at least three repetitions per target, with stable ambient noise and consistent microphone distance.
- Verify waveform and F0 diagnostics, including isolated tone 3 often pronounced low rather than a full fall-rise; do **not** assume every third tone must display a complete dip.
- For two-syllable phrases such as **公司 gōngsī**, **学习 xuéxí**, **中文 Zhōngwén**, and **你好 nǐ hǎo**, check each syllable separately. In natural 你好 the first underlying third tone surfaces closer to a rising tone due to tone sandhi; avoid flagging this as wrong.
- Quality gate: at least **5 separately voiced 30-ms RMS frames per syllable** plus sufficient valid F0 evidence. A short 90-ms second vowel must report **insufficient data**, even if overlapping pitch windows appear numerous.
- Stop must freeze recorded diagnostics. Changing the manual syllable boundary must not bypass the voiced-frame check. Background or silence must not become a valid syllable.
- **Passing acoustic signal sufficiency is not a correct-tone grade.** No automatic red/green pronunciation verdict without validated real-speech evaluation against appropriate Mandarin references and native-speaker review.

## Sign-off
- CI: pass / fail / not run; commit:
- Android Chrome mic: pass / fail / not run; device and version:
- User confirmation before send: pass / fail / not run:
- Real-world audio/F0 capture: pass / fail / not run:
- Native-speaker review: pass / fail / not run:
- Exact approved voice coverage: pass / fail / not run:
- Offline and 360/393/412 px layout: pass / fail / not run:
- Decision: **blocked** unless all applicable release gates above are confirmed.
