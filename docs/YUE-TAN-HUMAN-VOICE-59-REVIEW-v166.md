# Panda Go: Yue Tan · 59 human Mandarin recordings (review page, v166)

**Status:** Standalone listening page, NOT a replacement for production lessons.

## User-approved voice

User chose the natural female Mandarin voice **Yue Tan** of Liaoning (Shtooka collection `cmn-caen-tan`) after rejecting inaccurate synthetic voices. Approved examples include real native Mandarin tones on several isolated terms. These reviews do not establish that all recorded phrases are independently audited.

## Implementation

- Public standalone route `/yue-tan-listening.html` with responsive controls, a search filter, and a separate audio button for each word
- 58 original MP3 recordings staged without changing bytes from `review/hsk1-yue-tan-v163/audio` (the original source: `hugolpz/audio-cmn`, original recording Yue Tan/Shtooka)
- For `日` the existing verified licensed female recording remains at `assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3`
- `assets/yue-tan-human-v166.json` lists exactly 59 source-matched entries, the original characters, reference pinyin, MP3 paths, and human source attribution
- No audio time stretching; each MP3 plays at its native recorded speed
- **No change to production HSK1 voices, the 7 lesson layouts, user progress, 14 male lines, or existing tone reference exercises**
- There remain **65 missing course audio positions** representing 56 unique phrases. An additional original 8,596-recording Yue Tan archive was indexed; it did not yield any additional **exact phrase** matches from that list. Substring matches are intentionally rejected: `一个` ≠ `一个劲儿`, `妈` ≠ `妈妈`.

## Attribution and restrictions

**Yue Tan © 2009, Shtooka Project**, Creative Commons Attribution–ShareAlike 3.0 United States: https://creativecommons.org/licenses/by-sa/3.0/us/ .

MP3 recoding and curation by **Hugo Lopez / audio-cmn**: https://github.com/hugolpz/audio-cmn .

Under this license, preserve author attribution, source and license links, indication of any transformations (including MP3 conversion), and compatible share-alike terms for adaptations. Do not claim the author endorsed Panda Go.

## Quality gates

Automated: each MP3 has a valid codec, duration, and source-file byte identity; 59 catalog entries correspond to 59 playable paths; separate human 日 exists; no fallback to synthetic voice.

Human: Android/Chrome playback and Mandarin-native tone check still advisable. The dedicated review page enables user inspection without risking teaching incorrect pronunciations in the live course. 
