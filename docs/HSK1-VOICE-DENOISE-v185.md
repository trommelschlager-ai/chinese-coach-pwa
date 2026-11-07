# Panda Go HSK 1: approved native-speaker noise cleanup (v185)

Date: 2026-11-07. Source: user-provided recordings of the same Chinese native speaker, approved after before/after listening. Gentle stationary noise reduction, strong attenuation only in pauses, no voice cloning, no pitch or speech-rate changes.

This revision replaces the audio payloads in `assets/hsk1-human-voice-v183.js` (36 original clips plus one joined original utterance) and `assets/hsk1-human-voice-v184.js` (9 additional distinct clips). Both maps preserve existing Chinese-string keys and switch the already mapped lesson words to cleaned original recordings. Other voices are not falsely labeled as the same speaker; incomplete coverage remains.

Cache-bust audio URLs to v185 in `hsk1-lesson.html`, update the service worker cache name, and include both packs in the optional offline asset list. Existing UI, step sequence, progress keys, and lesson logic remain untouched. The source recordings were preserved. Human listening quality control should confirm no syllable clipping or damaged tones before the paid-course launch.
