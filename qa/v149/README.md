# Assemble & animate — café

Six sentence-building tasks integrated at `?panda=alive` and in the existing games menu. Existing games remain available. All three reactions (sip, order, refuse) follow the sentence meaning. Incorrect answers remain editable. Pinyin, replay, restart and a local completion marker are included.

Validation: `npm run check` and `npm run check:release` passed. New JSDOM regression covers wrong order, token return, pinyin, all six tasks, action selection, completion, restart, and local recording availability. Browser checked in the existing 390 px wide app shell: tea and coffee assembly, result, next task, scene and controls fit without vertical overflow (714 px content height). No physical Android test was performed.

Audio uses existing Yue Tan recordings one word at a time, explicitly labelled “По словам”, with matching word highlights. This is not a continuous sentence recording. Motion respects reduced-motion preferences. Art is inline SVG with CSS transforms, no remote AI service or new dependency.

`cafe.png` is a browser screenshot of the working coffee task.
