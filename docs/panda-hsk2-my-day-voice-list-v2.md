# Panda AI · HSK 2 · 我的⼀天 — missing approved-voice recordings

Status: **recording required**, as of 2026-11-20. This is a coverage list, not an assertion that the MP3s exist.

## Voice lock
- Use the **same adult Chinese LuvVoice speaker** approved for Panda AI. Keep the exact voice/voice settings for every line. Never mix Android browser TTS, HSK1 lesson speakers, or other voices.
- One exact Chinese sentence per MP3, Mandarin (zh-CN), normal speaking speed and natural tones, without noise and without translating Russian aloud.
- Name recordings `day01.mp3` etc. (one sentence each). If exported as a continuous file, preserve clear pauses for slicing, then verify each cut.
- Chinese phonetics note: `洗脸` is lexically `xǐliǎn`, but the first third tone is realized as second in connected speech, approximately `xíliǎn`. Keep natural tone sandhi; do not change written pinyin.
- The approved Panda appearance and environment stay unchanged.

## Required: 7 currently missing exact recordings

| Clip | Chinese transcript (exact) | Pinyin | Purpose |
|---|---|---|---|
| day01 | 你好！今天我说说我的一天。 | Nǐ hǎo! Jīntiān wǒ shuōshuo wǒ de yì tiān. | Introduction |
| day02 | 我早上刷牙。 | Wǒ zǎoshang shuāyá. | Story A |
| day03 | 你早上吃早饭吗？ | Nǐ zǎoshang chī zǎofàn ma? | Question 3 |
| day04 | 你几点去上班？ | Nǐ jǐ diǎn qù shàngbān? | Question 4 |
| day05 | 你晚上几点睡觉？ | Nǐ wǎnshang jǐ diǎn shuìjiào? | Question 5 |
| day06 | 我九点去上班。 | Wǒ jiǔ diǎn qù shàngbān. | Story B |
| day07 | 我晚上十一点睡觉。 | Wǒ wǎnshang shíyī diǎn shuìjiào. | Story B / sample answer |

## Useful additional sentences, also currently without exact clips

| Clip | Chinese transcript (exact) | Pinyin | Purpose |
|---|---|---|---|
| day08 | 我早上不吃早饭。 | Wǒ zǎoshang bù chī zǎofàn. | User's possible answer / feedback |
| day09 | 我不上班。 | Wǒ bú shàngbān. | User's possible answer / feedback; 不 tone sandhi |
| day10 | 现在请你说说你的一天。 | Xiànzài qǐng nǐ shuōshuo nǐ de yì tiān. | Start independent monologue |
| day11 | 我没听清楚，请再说一遍。 | Wǒ méi tīng qīngchu, qǐng zài shuō yí biàn. | ASR retry, not pronunciation judgment |
| day12 | 这是你的一天。 | Zhè shì nǐ de yì tiān. | Introduce personal story |
| day13 | 做得好！ | Zuò de hǎo! | End |
| day14 | 我们再试一次。 | Wǒmen zài shì yí cì. | Retry |

## Existing phrase recordings (reuse; do not rerecord unnecessarily)

- `我每天七点起床。` — approved HSK2 Lesson 1 native audio v459
- `我起床以后洗脸。` — approved Panda v365
- `我早上吃早饭。` — approved Panda v365
- `我八点去上班。`, `我晚上十点睡觉。`, `我每天六点起床。` — approved Panda grammar audio v451
- `你每天几点起床？` — approved HSK2 Lesson 1 native audio v459
- `你起床以后做什么？` — approved Panda v365
- `我起床以后刷牙。`, `我早上洗脸。`, `我每天八点起床。` — approved HSK2 Lesson 1 native audio v459

## Runtime limitation that must be addressed before final approval

The personal recap must reproduce **arbitrary user-supplied times and actions**. Finite pre-recorded MP3s cannot cover every grammatical combination or arbitrary freely spoken sentence. To have Panda speak all individualized lines in one voice, integrate a single selected Mandarin TTS voice (with appropriate rights and API credentials) and use it consistently for **all** Panda utterances, or constrain spoken output to a vetted finite phrase bank and show the remaining user answers as text. Do not silently switch voices or assemble arbitrary snippets that distort Chinese tones.

Current implementation takes the safe latter path: exact approved recordings only; missing or novel lines remain **text-only**, explicitly identified. No acoustic tone scores are inferred from ASR transcripts.

## Release checklist
1. Record and QA day01–day07 (plus day08–day14 for fuller feedback).
2. Verify same speaker timbre, loudness, speech speed, neutral tones and third-tone sandhi; audit every source and cut.
3. Import MP3s and wire exact-text map, prefer same-voice clips only; no browser fallback.
4. Verify Android Chrome playback, no overlaps with recognition, repeat/pause and background visibility.
5. Test free learner answers and recap separately; keep unrecorded answers text-only until fixed-voice TTS exists.
