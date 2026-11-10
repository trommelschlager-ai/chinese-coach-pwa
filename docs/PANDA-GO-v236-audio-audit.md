# Panda Go · HSK 1, lessons 1–7 — audio and curriculum review, v236

Checked: 2026-11-10. This update is a *programmatic* correction, **not** a claim that all MP3 audio was listened to or acoustically validated.

## Implemented in v236

- **Lesson 4:** latest 22 whole-word/phrase recordings supplied by the approved female speaker (v221) take priority over older clips, with recorded-file fallback. Obsolete notices about 星期天, the sample dialogue and number of available recordings are removed.
- **Lesson 3:** 一百 (yì bǎi) uses a consistent, shipped file from the female v160 voice map before falling back to the device's TTS. This file is generated audio and still must be replaced with a checked natural recording.
- **Lessons 2, 4, 5, 6 and 7:** local playback leveling of the learner's own microphone sample when Web Audio is supported. Gain is conservative (max 4x) and capped for peaks. No audio is transmitted by this feature, no pitch or speed changes. If processing fails, the original recording continues to work.
- **Lesson 5:** request echo cancellation, noise suppression, automatic gain, and mono microphone input for recordings.
- **Lesson 7:** the four seasons are marked as optional vocabulary, to avoid forced memorization before the core weather structures are learned.
- **Lesson 1:** existing local recording normalization retained.
- **Regression:** code for the old lesson 4 first-screen test was updated to the currently approved layout; new v236 audio-routing test runs in the course QA workflow.
- No Chinese phrase content, approved page artwork, 14-step sequences, user progress storage keys, or dialogue-role genders were rewritten.

## Outstanding — needs acoustic checking / source recordings

| Lesson | First candidates |
|---|---|
| 1 | Listen to tones mā, má, mǎ, mà for harshness; verify 学生 and 是 endings aren't cut; compare volume to learner playback |
| 2 | 您 (nín) still relies on device speech; also review 你们 and 我是老师 for noise and voice consistency |
| 3 | 一百 (yì bǎi) needs a native whole-phrase take; assembled numbers must be checked for transitions and tone sandhi |
| 4 | Validate all 22 v221 takes for noise, tones, duration and actual loudness; check older backup audio separately |
| 5 | Record 今天几月几号？ and 今天十一月六号。 as complete sentences, and the missing full month clips |
| 6 | Record 一个, 是，这是我妈妈。, 有，我有一个妹妹。 as complete phrases |
| 7 | Record 下雨, 下雪, 今天天气怎么样？, 今天很冷。 with the approved speaker |

The v221 supplementary set for lessons 5–7 contains 44 distinct audio sources; 049 and 050 are not routed to a phrase yet. Do not invent labels. New voice recordings require the speaker's approval and manual listening QA before going live.

## Final acceptance test

1. All audio buttons must load playable sources, and Chinese transcripts must match pronunciation.
2. No background hiss, clipping, missing syllable endings or abrupt/robotic transitions.
3. Native speaker must approve tones, neutral tones, and tone-sandhi contexts.
4. Two roles in dialogues can use distinct voices, but the same role should be consistent.
5. All seven lessons' screen flows, microphone/permissions, and saved progress must pass on Android.
6. QA, offline shell and Pages deployment must pass after the final commit.

**Limit:** static code and CI can prove existence and playback paths, not a human-quality Mandarin accent.
