// The current storyboard regression checks answer scroll stability, audio states
// and touch navigation across the three Android viewport sizes.
process.env.HSK2_QA_WIDTHS ??= '360,393,412';
process.env.HSK2_QA_DIR ??= 'qa/hsk2-v417';
await import('./qa-hsk2-day-panda-mobile-v1.mjs');
