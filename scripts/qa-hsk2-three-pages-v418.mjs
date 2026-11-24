// The live lesson now presents the seven tasks over four test pages.
process.env.HSK2_QA_WIDTHS ??= '360,393,412';
process.env.HSK2_QA_DIR ??= 'qa/hsk2-v418';
await import('./qa-hsk2-day-panda-mobile-v1.mjs');
