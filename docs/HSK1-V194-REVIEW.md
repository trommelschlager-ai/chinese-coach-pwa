# Panda Go HSK1 first lesson v194 — release QA / limits (2026-11-08)

## Implemented
- Introduce 好 (女 + 子) before showing its writing; explain its own two components on the third intro screen rather than jumping to components of yet-unknown 我, 是, 学生.
- Present 手 near 我, 日 near 是, and 子 within 学 only after those words first appear. These descriptions are optional disclosures.
- Preserve no-selection four-tones introduction and continuous six-stroke 好 animation.
- Present one listening recognition check after the speaking exercise using only 我, 是, 学生, with a real native-audio candidate preferred when available.
- Persist verified sentence assembly and listening correctness across page reload, preserving earlier lesson completion state.
- First HSK1 map lesson reports **15 screens** while lessons 2–7 retain their independent **7-step** engine. End card lists learned words rather than unintroduced radicals.
- PWA cache bust and offline manifest refreshed.

## Not yet verified / do not claim
- A green CI test confirms the JavaScript scenario, not subjective sound quality or actual Android visual layout.
- Native voice recordings are present for only a subset of the course. Missing utterances still use other preexisting licensed / synthesized recordings. No original recordings were fabricated or modified.
- Four tone examples use a separate human voice from the user's specifically approved recordings; linguistic and sound QA is still necessary.
- To make a more natural full question-and-answer conversation, teach 吗 (ma) first and obtain a clean original recording of 你是学生吗？; otherwise do not replace with a broken or silently synthesized phrase.
- Before expanding HSK1 lessons 2–7, establish the intended HSK syllabus and verify every new teaching point before the dialogue.

## Next checkpoint
Human playback on Android: every recorded phrase and all four tone examples, display at 320/360/390 px, offline loading, restart at builder and listening, back/forward, page reload, and progress unlock for lesson 2.
