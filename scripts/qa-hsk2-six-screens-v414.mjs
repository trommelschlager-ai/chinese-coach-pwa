// Keep the release check's original entry point as the day unit evolves.
process.env.HSK2_QA_WIDTHS ??= '360,393,412';
process.env.HSK2_QA_DIR ??= 'qa/hsk2-v414-six-screens';
await import('./qa-hsk2-day-panda-mobile-v1.mjs');
