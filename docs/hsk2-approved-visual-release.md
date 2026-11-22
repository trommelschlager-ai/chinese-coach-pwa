# Panda Go HSK2 — approved visual covers (22 Nov 2026)

The user approved ten complete 941×1672 classroom-style covers. Only the cover layer changes; audio, pronunciation, exercises, progress, lesson lock state, and other internal content remain as in the existing site.

## Installation status

The GitHub branch contains the source-side integration only. **Image binaries have NOT been transferred to the GitHub repository yet. The live main branch is unchanged.**

Upload the following 20 binary files from the ChatGPT-generated package Panda_Go_HSK2_all_10_ready_for_GitHub.zip to this branch:
- assets/hsk2-approved-covers/lesson-01.png through lesson-10.png — exact approved originals, 941×1672
- assets/hsk2-approved-covers/lesson-01-tail.webp through lesson-10-tail.webp — decorative extensions for tall Android screens

The shared JS and CSS, the complete manifest with SHA256 hashes, and 10 HTML script/CSS links are already committed on this branch.

Progressive loading guarantees that if an image is missing, the original working cover remains visible instead of displaying a broken image. All clickable zones (data-step=2..7 and Start) use the application's existing navigation handler.

## Testing required before merging

1. Upload binary files to the branch, preserving filenames and directories. Do not replace them with thumbnails.
2. Run the HSK2 approved full-cover assets GitHub Action: all ten images must match manifest SHA256 and size and all continuation assets must exist.
3. Render all ten original app pages on 360×800, 393×873 and 412×915 Android mobile viewport.
4. Check no blank top/bottom bands, no image stretching, six clickable zones + Start + map back link.
5. Return to a cover after opening words and verify it reappears. Check existing audio, tests, pronunciation, progress and stored state.
6. Only then merge PR to main and verify the live GitHub Pages version.

The standalone package was tested in mobile Chromium 30/30 image preview renders. That is not a full browser QA of real site pages.
