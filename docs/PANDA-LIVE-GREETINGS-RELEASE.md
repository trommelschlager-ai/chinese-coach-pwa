# Panda Go: local-time greetings and topic arrows

Only the conversational pilot changes. Home, approved lesson pages 1–7, existing recordings and original mascot are unchanged.

Four clips are split from the user-provided `luvvoice.com-20261111-HaHIIB.mp3`, with source retained in assets/panda-live-voice-v4/source-original.mp3. manifest.json contains exact source ranges, hashes and source ASR transcript: 早上好 中午好 下午好 晚上好. No new voice is synthesized or substituted. No paid API is used. Matching RMS envelopes drive the mouth only during actual media playback. ASR text confirmation is not an independent assessment of acoustic tones.

Device-local hour: 05–10 早上好; 11–12 中午好; 13–17 下午好; 18–04 晚上好. The selected greeting remains stable for the current conversation. The learner may answer the same greeting (Chinese or supported pinyin) or 你好. Unrelated and duplicated responses do not advance the dialogue. Meanings and pinyin for all four greetings are in the collapsed help before speaking.

The native select is replaced by 50px previous/next links, centered theme and topic count. Next from topic 7 wraps to topic 1; previous from 1 wraps to 7. Links encode the target topic in the URL and stop audio and microphone when activated. Normal navigation excludes unfinished drafts.

Validation: ten Node tests pass, covering all hour boundaries, all seven conversations, answer matching, unchanged source data, MP3 hashes/envelopes, topic wraparound and draft filtering. GitHub mobile QA exercises all four local-time greetings at 320px, actual MP3 playing events, rejection of wrong answers, arrows in both directions and wraparound; the existing 360/390/412px dialogue scenarios still run. All 23 mapped MP3 files are checked.

Physical Android microphone and acoustic tone assessment remain untested. Browser speech recognition depends on Chrome permissions and network service. Typed answer fallback remains available. Course completion gating is outside this change.
