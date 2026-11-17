# HSK2 lesson 1: preimplementation audit for six approved screens

Date: 2026-11-17. Source commit: `13e1ffba0ef45388a29a636565cdc6e6224db328`.
Status: BLOCKED BEFORE VISUAL IMPLEMENTATION. No lesson UI change, no deployment, no mobile screenshot, no acoustic audio certification.

## Preserved source
Backup branch: `backup/hsk2-v413-before-six-screens-20261117`.
Work branch: `work/hsk2-lesson1-six-approved-screens`.
Both created at the source commit before any work. The backup preserves the entire committed repository, including existing MP3s. Uncommitted or out-of-repository files are outside this backup.

## Required visual contract
Use all six images attached to the task, identified by their visible content, not upload order. No image regeneration and no approximate replacement panda/landscape.
Order: Слово → Правило → Речь → Тест → Примеры → Panda AI.
Keep purple/lilac/pink/gold colors, cream panels, gold next buttons and active-state highlights. Natural landscape colors remain.
Implement actual HTML controls and dynamic text; do not layer duplicate text on a complete screenshot. Extract original decorative regions/illustrations and use them as assets.
Apply this structure only to topic index 0, all three mini-lessons. Their word counts are 7/7/6; mini-lesson 3 must not invent a seventh word.
Do not modify HSK1, other HSK2 topics, or global Panda AI behavior.

The attached source images are visible in the task, but their bytes have NOT been copied into this branch. Files named 36257.png through 36262.png must be matched visually before import. No filename-to-screen mapping is asserted here.

## Source findings
1. `hsk2-life-course.html` references 12 stylesheets, including a sequence of previous day/viewport/art patches. New visual rules need isolation to topic 0, not another uncontrolled global patch.
2. `assets/hsk2-day-first-ui-v1.js` defines five stage names. Its stage 4 calls completion; Panda AI is a separate link on the completion view in `assets/hsk2-life-course-app-v1.js`.
3. Current initial word screen is the older `approved-course-v390/day-lesson.png` with transparent hotspot buttons, followed by a different HTML word-detail layout. This does not implement the six newly approved screens.
4. The speech screen presents one selected word and five attempt slots, not seven independently controlled rows. Both its render and recognize paths stop attempts at five, even if all recognized attempts are wrong. Change retry policy and persisted state together.
5. Existing ASR records real returned transcript text and compares normalized characters. Preserve the honest tone limitation and error paths; never treat a mocked transcript or empty result as success.
6. Existing test contains two multiple-choice questions plus a sentence builder. It does not implement the seven requested exercise types.
7. Existing examples differ from the three requested sentences. Keep mini-dialogue access within the examples stage.
8. Existing `panda-hsk2-day-coach-v1.mjs` supplies 3/4/5 questions by mini-lesson. Its first question is 你早上做什么？; the requested first 你几点起床？ is not that question. Its checking is finite pattern-based, with reviewed translations, not open-ended AI inference.
9. Progress uses `pg-hsk2-life-course-v1`, a `stepOrderV413` marker, and topic-0 stage clamping to 4. A sixth stage requires an explicit migration, persistence update, and safe old-progress restoration. Retain completed lesson IDs and difficult-word entries.

## Minimal necessary deviations from reference pixels
- Examples reference says “Завершить урок”; use “Дальше → Panda AI” to meet the specified six-stage path. Complete only after the practice stage.
- Rule reference omits the subject and says 每天 stands at the beginning. Correct to 我 + 每天 + 七点 + 起床, with the requested explanation. This is a teaching correction, not a new design.
- Test reference contains preselected checks and drawn matching lines. Initial real controls must be unanswered; show checks/connections only from learner actions and answer data.
- Speech title should describe speech practice/recognition without claiming acoustic tone grading. Keep a concise explicit “Тоны не оценены”.
- Mini-lesson 3 has six actual vocabulary entries. Render six data-driven rows in the same style.
- On Android sizes where content cannot fit legibly, keep header/actions accessible and scroll the task area, as authorized.

## Audio inventory method and limits
Inventoried the complete recursive repository tree: 4,362 entries, including 2,868 MP3 paths.
Evaluated the reviewed data-only lesson definitions and currently loaded phrase-index/audio lookup code in an isolated JavaScript context. Called lookup only, never play; checked each mapped source path against the repository tree.
This checks exact text mappings and source file existence. It DOES NOT verify decoded audio, pronunciation, tones, noise, gain, clipping, segment boundaries, or Android playback.
There may be unindexed recordings elsewhere in the repository. Their filename or mere existence is not proof that they contain the required phrase or the approved voice. Supplied archives and unindexed audio were NOT audibly inspected in this session.

| Current material | Unique texts | Mapped to existing source MP3 | Without exact current mapping |
|---|---:|---:|---:|
| Vocabulary across three mini-lessons | 20 | 0 | 20 |
| Existing examples/targets/dialogue lines | 16 | 1 | 15 |

Mapped audio is a segment of a longer original recording, not a separate per-phrase MP3.

### Mini-lesson 1: Мой распорядок дня

| Word | Pinyin | Exact current audio |
|---|---|---|
| 每天 | měitiān | No mapping |
| 早上 | zǎoshang | No mapping |
| 起床 | qǐchuáng | No mapping |
| 洗脸 | xǐliǎn | No mapping |
| 刷牙 | shuāyá | No mapping |
| 早餐 | zǎocān | No mapping |
| 吃早饭 | chī zǎofàn | No mapping |

| Existing sentence / dialogue line | Exact current source |
|---|---|
| 我每天七点起床。 | No mapping |
| 我六点起床。 | No mapping |
| 我早上吃早饭。 | ./assets/hsk2-user-voice/20261114-7JVWfV.mp3 (segment; source exists) |
| 你每天几点起床？ | No mapping |
| 你早上吃早饭吗？ | No mapping |

### Mini-lesson 2: Утро, работа и вечер

| Word | Pinyin | Exact current audio |
|---|---|---|
| 上班 | shàngbān | No mapping |
| 下班 | xiàbān | No mapping |
| 中午 | zhōngwǔ | No mapping |
| 午饭 | wǔfàn | No mapping |
| 下午 | xiàwǔ | No mapping |
| 晚上 | wǎnshang | No mapping |
| 晚饭 | wǎnfàn | No mapping |

| Existing sentence / dialogue line | Exact current source |
|---|---|
| 我先吃早饭，再去上班。 | No mapping |
| 我下午五点下班。 | No mapping |
| 我中午吃午饭。 | No mapping |
| 你早上先做什么？ | No mapping |
| 我先刷牙，再吃早饭。 | No mapping |
| 你下午几点下班？ | No mapping |

### Mini-lesson 3: Мой вечер и привычки

| Word | Pinyin | Exact current audio |
|---|---|---|
| 睡觉 | shuìjiào | No mapping |
| 以前 | yǐqián | No mapping |
| 以后 | yǐhòu | No mapping |
| 先 | xiān | No mapping |
| 再 | zài | No mapping |
| 常常 | chángcháng | No mapping |

| Existing sentence / dialogue line | Exact current source |
|---|---|
| 我晚上常常看书。 | No mapping |
| 我下班以后休息。 | No mapping |
| 我晚上十一点睡觉。 | No mapping |
| 你晚上常常做什么？ | No mapping |
| 你几点睡觉？ | No mapping |

### Requested new/reference texts
| Text | Exact current source |
|---|---|
| 我早上洗脸。 | No mapping |
| 我每天刷牙。 | No mapping |
| 我吃早餐。 | No mapping |
| 我每天七点起床。 | No mapping |
| 你几点起床？ | No mapping |
| 你早上做什么？ | ./assets/hsk2-user-voice/20261114-7JVWfV.mp3 (indexed segment) |

我每天七点起床。 is already counted in the 15 missing existing texts; do not count it twice. The three newly specified example sentences and 你几点起床？ add four distinct missing texts. 你早上做什么？ is indexed in 20261114-7JVWfV.mp3, whose source path exists.
Do not replace missing audio with other sentences. If device synthesis is retained as an explicit fallback, keep its visible label. Do not change existing recording voices.

## Validation actually performed
- GitHub repository access and full tree retrieval: succeeded.
- Source commit and relevant HTML/data/UI/audio/Panda coach inspection: succeeded.
- Backup/work branch creation: succeeded.
- Data load: 3 mini-lessons, 20 words, 16 distinct current target/example/dialogue texts.
- Exact audio lookup + mapped source path existence checks: performed; counts above.
- Browser rendering, screenshots at 360×800 / 393×852 / 412×915: NOT RUN.
- Automated app regression tests: NOT RUN.
- Real microphone, retry flow, navigation restoration: NOT RUN.
- Acoustic quality and real Android Chrome playback: NOT RUN.

## Blocker
The current session has no executor/filesystem runtime and no managed interactive browser. GitHub connector access alone cannot import/crop the attached image bytes, render the app, collect six real mobile screenshots, or verify microphone/audio playback. No publication is permitted under the user's requirements until those checks are completed. Do not describe this branch as implemented or ready to merge.

## Next implementation sequence
1. In an execution-enabled session, check out the work branch and read any applicable AGENTS.md.
2. Import the six exact task attachments. Match them by contents and extract the original panda, scenery and illustrations without changing their appearance.
3. Implement scoped six-stage HTML/CSS layouts with data for each mini-lesson. Remove reliance on the old day poster for topic-0 lesson views only.
4. Implement grammar interaction, unlimited speech retries, seven exercise types, the examples/mini-dialogue view, and scoped existing Panda AI integration.
5. Add a progress schema migration that preserves existing completed IDs and handles older five-step resumes.
6. Inspect unindexed audio/archives before marking files missing globally. Use only confirmed text/voice matches; obtain exact missing recordings as needed.
7. Run behavioral regressions and mobile visual comparisons. Capture all six implemented screens, and exercise wrong answers, retries, back navigation, text and real voice input.
8. Produce the final evidence report, then publish only after required checks pass.
