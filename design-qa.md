# Final design QA — Chinese Coach v29

final result: passed

## Visual truth and evidence

User attachments: `01-31519.png` (dialogue), `02-31516.png` (AI scenarios), `03-31517.png` (lesson check), `04-31518.png` (mini-test). The original attachments are 864 × 1536 px at approximately 2× mobile density. Device status bars are excluded from app fidelity judgments.

Browser-rendered implementation: `http://terminal.local:4173/`, verified through the cloud browser. Mobile tests use the existing app inside a 432 × 900 CSS px iframe (417 px usable content after the desktop scrollbar), not a replacement app. Screenshots captured at 1× density. The local-only QA wrapper is excluded from Git. Desktop viewport: 1348 × 926 px.

Evidence: `qa/dialogue-mobile.jpg`, `qa/ai-mobile.jpg`, `qa/lesson-check-mobile.jpg`, `qa/mini-test-mobile.jpg`, `qa/desktop.jpg`. Side-by-side reference/implementation inputs: `qa/dialogue-comparison.jpg`, `qa/ai-comparison.jpg`, `qa/lesson-check-comparison.jpg`, `qa/mini-test-comparison.jpg`.

Comparison uses the relevant app-owned regions, normalized to approximately 432 px wide. Scroll positions and device chrome differ; they are not treated as layout regressions. Mini-test questions are randomized, so the captured word differs from the reference example. The tea/thanks/friend/good image mappings are checked independently. Full-view comparisons retain readable controls, so separate magnified crops were unnecessary.

## Findings and comparison history

1. P2: `cover` cropping cut off faces on short answer buttons. Fixed by scaling individual photos by button height and positioning the subject inside the right-hand safe area. Recapture confirms visible faces and objects.
2. P2: Narrow photo layers revealed a vertical boundary. Fixed with a fade measured from the right edge; recaptured lesson answers show continuous transitions.
3. P2: An initial typography override reduced dialogue hanzi. Restored the established 50–77 px range; Russian translation and action labels retain their requested increase.
4. P2: Mini-test labels remained centered in a locally cached stylesheet. Added explicit left alignment and a fresh stylesheet URL. Browser computed-style verification confirms `text-align: left` and 22.464 px answer text at the mobile test width. Final mini-test capture shows the correction.

No actionable P0/P1/P2 visual finding remains for the requested update.

## Required fidelity surfaces

- Typography: established font stacks retained, larger readable Russian translations, action labels, Chinese answer characters and mini-test labels. Longer scenario text wraps naturally at mobile width. No essential content is truncated.
- Layout: original navigation and four lesson stages retained; single-column numbered lesson answers and two-column mini-test/scenario cards follow the references. Gold rounded frames and adequate tap targets remain. Desktop controls are usable with normal page scrolling.
- Colors: pink/lilac buttons, gold borders, white-to-photo transitions, dark foreground copy, and existing correct/incorrect colors preserved. New photos use moderate saturation.
- Imagery: 35 separate optimized WebP images, all inspected together. Scenarios and answers select pictures by meaning rather than shuffled position. No screenshots, watermarks, logos or UI fragments used as new content assets. The approved welcome illustration is byte-for-byte unchanged.
- Copy/content: all five COURSE objects are byte-equivalent after parsing, including 65 vocabulary items, dialogues, explanations and 35 quiz questions. Requested mini-test explanatory copy and technical footer removed. Progress keys and storage logic retained.

## Verification

`npm run check`: 20 lesson stages, 35 questions, 140 answer options, 65 mocked Mandarin utterances; zero missing image files. Correct/wrong answers, answer locking, next question, completion scores, persistent lesson results, 10-question mini-test flow and both scenario prompts verified.

`node scripts/verify-offline.cjs`: install, upgrade from v28, offline navigation and cached assets passed; 78 cache URLs, including all new images and versioned JS/CSS. Version v29.

Cloud browser: lesson switching, stage switching, correct answer and next-question affordance, mini-test answer locking, cafe scenario selection, tone selection, speech-button invocation, mobile layout and desktop layout checked. No application console errors were found; browser-extension metadata messages are unrelated to this app.

## Test limits and follow-up polish

Physical Android/iPhone devices and Safari were not available. The cloud browser has no working installed Mandarin system voice; the existing failure/help flow appears correctly. Actual audio output and microphone scoring on a physical device remain device-dependent and were not certified by these checks. The speech/recording algorithms were not modified.

P3: scenario text can wrap differently from the generated mockup because the working app uses real responsive typography. Newly generated scenes share the approved art direction but are not pixel copies of reference artwork.

Implementation checklist: backup branch created; live HTML controls preserved; semantic images integrated; cache updated; automated checks passed; mobile and desktop browser evidence captured. Publication verification is recorded separately after GitHub Pages completes.
