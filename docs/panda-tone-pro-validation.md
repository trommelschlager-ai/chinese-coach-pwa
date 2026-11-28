# Panda Tone PRO — real speech validation gate
## Pilot: HSK2 My Day
Use the existing approved recordings as listening references, not as ground truth for classifier accuracy. Obtain separately consented recordings from multiple Mandarin native speakers and learners. Keep participant IDs pseudonymous. Do not upload student recordings automatically.
## Corpus
Six words: 起床 qǐchuáng, 洗脸 xǐliǎn, 刷牙 shuāyá, 吃早饭 chī zǎofàn, 去上班 qù shàngbān, 睡觉 shuìjiào. Include isolated tones, naturally spoken correct words, intentional wrong tones, quiet/noisy conditions, and different microphones. Start with two independent Mandarin reviewers marking syllable boundaries, expected surface tones, and acceptability; adjudicate disagreements. Neutral tone in 早上 is context-dependent; do not score it via a fixed contour. Third-tone sandhi in 洗脸 is normally rising + third; nonfinal third tones need not dip-rise.
## Calibration and separation
Collect separate natural low/mid/high speaking samples per speaker, not the test clips. Split development and held-out evaluation by speaker, not by clip. Never tune thresholds on held-out data.
## Metrics
Report per-tone confusion matrix, coverage (graded / total), accuracy among graded, false acceptance of incorrect tones, false rejection of correct tones, and uncertainty. Count all abstentions explicitly. Report by speaker, device, noise and isolated/connected context. Targets are aspirations, not results. For an initial pilot aim for >=90% accuracy among graded words at >=80% coverage and <=5% false acceptance of incorrect tones; report sample counts and uncertainty intervals. No release on synthetic tests alone. If natural speech cannot be classified reliably, show contour comparison only.
## Release boundary
Do not enable automatic correct/incorrect feedback until human-annotated held-out validation and Android microphone checks succeed. Do not claim phoneme, lexical, or pronunciation accuracy from pitch alone. No lesson or audio changes as part of this protocol.
