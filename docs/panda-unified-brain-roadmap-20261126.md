# Panda unified conversation engine — stage 1

Baseline: v565 release candidate bd5d51264fae9043ea6e714d7b8d44953ad92fd8. Keep Panda AI and Street visuals, voices, offline recordings and graded My Day unchanged. Do not merge pilot before v565 passes.

## Actual code audit
- Active core imports 33 modules and routes among natural statements, everyday meaning, graded HSK2, correction, live dialogue and legacy extra speech.
- Natural module already has compositional routine, action sequence, cause/condition/contrast, course scenes and topic-specific handlers. Clause dictionary is limited; new exact cases alone will not deliver free conversation.
- Street shared brain imports live-dialogue v434 and grammar correction v2, not the active natural module. Shared profile is already available; avoid duplicating sensitive facts or inferring them.
- Historical voice audit: 150 inputs, 118 distinct responses, 60 exact registered recordings, 58 missing at the then-current commit. Not a current exhaustive inventory or native acoustic review.

## Stage 1 prototype
Pure semantic recognizer: 觉得 with target, modifier, adjective, negation, reciprocal opinion questions, known-only lexicon. Separate semantic interpretation from response selection and exact audio lookup. Unknown returns null; no fake certainty, audio or tone score. Do not deploy this branch yet. Verified directly in JS: 5 explicit examples, 240 generated combinations, 6 negative cases. Combinatorial checks verify parser, not linguistic naturalness of every possible combination. Later curate real learner examples and use held-out sets by construction. Next: intent schema (question, answer, clarification, agreement), last Panda turn, topic and pending question; then expand grammar patterns and connect both character adapters via feature gate. No model API or paid service assumed.

## Release gates
1. Existing v565 CI green and real Android confirmation of cache/animation; no loss of old replies. 2. Independent grammar unit tests with positive/negative/ambiguous cases; 3. multi-turn replay tests for both modes; 4. exact voice audit, text-only when unavailable; 5. integrate Street after regression tests and visual approval. Targets 1000 varied input tests, 100 dialogue chains, 95% appropriate replies on held-out human-reviewed corpus, 100% required recorded replies (not claimed achieved).
