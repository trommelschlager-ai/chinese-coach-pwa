# Panda AI v552 — family conversation voice coverage

Updated: 2026-11-24. This inventory concerns exact matching **approved Panda AI clips**, never mixed or synthesized voices.

## Exact approved Panda replies already available

| Panda reply | Approved clip |
| --- | --- |
| 我有一个哥哥。 | `./assets/panda-live-voice-v3/p12.mp3` |
| 我没有姐姐。 | `./assets/panda-voice-clips-v365/p107.mp3` |
| 我有一个妹妹。 | `./assets/panda-voice-clips-v411/p161.mp3` |
| 你哥哥几岁？ | `./assets/panda-voice-clips-v365/p108.mp3` |
| 你姐姐几岁？ | `./assets/qa-v411/panda-voice-clips-v422/p176.mp3` |
| 你弟弟几岁？ | `./assets/qa-v411/panda-voice-clips-v422/p177.mp3` |
| 你妹妹几岁？ | `./assets/panda-voice-clips-v365/p110.mp3` |

## New or combined replies needing recording

- `我没有弟弟。` — Wǒ méiyǒu dìdi. — У меня нет младшего брата.
- `明白了。你家有几口人？` — Míngbai le. Nǐ jiā yǒu jǐ kǒu rén? — Понятно. Сколько человек в твоей семье?
- `你想问什么？` — Nǐ xiǎng wèn shénme? — Что ты хочешь спросить?
- `你哥哥五岁！他喜欢做什么？` — Nǐ gēge wǔ suì! Tā xǐhuan zuò shénme? — Твоему старшему брату пять лет. Что он любит делать?
- Analogous age-based replies for 姐姐、弟弟、妹妹 and other numbers from 1 to 10 should be recorded **only after** their exact text is reviewed.

## Rules

- A clip must match the entire normalized Chinese answer; substrings and altered wording are **not** an audio match.
- For missing exact clips the app shows Hanzi, tone-marked pinyin, and Russian translation with no substitute voice.
- The previous HSK1 Non-Stop family dialogue retains its approved audio follow-up logic.
- ASR text cannot prove acoustic tone correctness. Tone scoring stays disabled without an independently validated acoustic analysis.
- These gaps are an action list, **not** recordings or approved audio assets. Do not change the voice without owner approval.

## Android 4:38–4:40 screenshot fixes — conversational replies

All six below are valid Mandarin inputs. v552 now recognizes them, shows the learner's **full pinyin with tones**, and returns context-appropriate replies. No approved recording matching the **entire** new Panda reply was found in the reviewed registries, so the app must show text (never synthetic voice or a clip for a different sentence).

| Learner | Reviewed Panda reply (record separately) | Pinyin |
| --- | --- | --- |
| 你很可爱 | 谢谢你！你喜欢熊猫吗？ | Xièxie nǐ! Nǐ xǐhuan xióngmāo ma? |
| 你很漂亮 | 谢谢你！你喜欢这里的风景吗？ | Xièxie nǐ! Nǐ xǐhuan zhèlǐ de fēngjǐng ma? |
| 太好了 | 太好了！我们继续聊吧！ | Tài hǎo le! Wǒmen jìxù liáo ba! |
| 你很酷 | 谢谢你！你喜欢我的耳机吗？ | Xièxie nǐ! Nǐ xǐhuan wǒ de ěrjī ma? |
| 你太厉害了 | 谢谢你！我们一起加油！ | Xièxie nǐ! Wǒmen yìqǐ jiāyóu! |
| 我不喜欢你 | 没关系。你想聊什么？ | Méi guānxi. Nǐ xiǎng liáo shénme? |

Related regression tests: `tests/panda-social-replies-v552.test.mjs`. Existing `我爱你` introduction remains unchanged and follows the approved original dialogue. Screenshots are the observed Android symptom, not proof of tone accuracy or successful MP3 playback. No app artwork/CSS is altered.
