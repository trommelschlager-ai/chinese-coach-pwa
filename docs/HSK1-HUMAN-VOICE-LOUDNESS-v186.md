# Panda Go HSK 1 — level-balanced native-speaker recordings v186

Date: 2026-11-07. Owner reported human voice quiet and inconsistent after v185 denoising.

- Used the original approved gently cleaned 47 recorded segments (11+36) without changing syllable order, audio speed or pitch.
- Each clip: speech-active RMS target -12.8 dBFS, with peak ceiling -1.6 dBFS; actual measured post-encode peak at most -2.26 dBFS; gain range -4.08 to +10.01 dB.
- Rebuilt one composite sentence from the newly leveled clips; preserves 37 original IDs in v183 and nine unique additional keys in v184; remaining synthetic clips are unchanged and must not be advertised as this human voice.
- Republished both bundles with ?v=186, renewed service-worker cache and offline voice-pack entries, updated regression check accordingly.
- Visual lesson layout and progress persistence have not been changed in this voice-only revision.
- Native Mandarin tone and audio-artifact listening QA is still required; background overlapping speech cannot be perfectly eliminated solely by level adjustment.
