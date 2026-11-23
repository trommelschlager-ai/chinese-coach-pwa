# Panda Street AI — castet motion, artwork-first review

**Status: ART REVIEW ONLY. Do not merge PR #201.**

Android footage `38731.mp4` established that the attempted canvas transforms are visibly unnatural. This source-pixel art study traced the **viewer-left fist with brass knuckles**, leaving the watch and forearm in their original places. No facial movement was attempted.

## Asset provenance and limitation

The source for this current diagnostic is **one frame of the user's Android screen recording (1080×2392)**. A **540×360 screenshot crop**, anchored at screen frame `x=100..640, y=1300..1660`, was manually outlined. This screenshot is NOT equivalent in fidelity, crop or dimensions to the original `693×1444` project files:

- `assets/panda-street-day-night/night.webp`
- `assets/panda-street-day-night/day.webp`

The actual production PNG layers **must be retraced on the original source pixels**. Never upload screenshot-derived assets to production as replacements.

## Candidate fist mask (diagnostic only)

Polygon below is local to the 540×360 crop. Keeps the gold bracelet/watch largely stationary, while exposing the fist and brass knuckles to an eventual separately painted motion pose:

```json
{
  "width": 540, "height": 360,
  "source": "38731.mp4 first frame / crop [100,1300,640,1660]",
  "part": "viewer-left fist + brass knuckles",
  "polygon": [[292,124],[294,109],[306,97],[323,99],[342,105],[367,115],[392,130],[413,148],[425,166],[433,184],[430,198],[439,213],[430,229],[413,237],[397,241],[382,251],[367,249],[351,247],[335,243],[319,236],[312,216],[304,199],[288,187],[279,170],[281,153],[286,137]]
}
```

## Diagnostic result

The source pixels can be isolated into a *genuine transparent RGBA cutout*. However, automatic inpainting of the newly exposed black jacket/pants fabric produces smeared, structureless areas and visible loss of gold bracelet and clothing folds. **Reject this reconstruction; hand-paint a clean plate and the covered cuff/fur first.**

Approved movement must preserve the entire character's identity, glasses, face, scar, pose and original background when at rest. Specifically, this fist is NOT an independent spherical object; it needs at least one hidden cuff/fur transition pose.

## Next acceptance gate (before any movement coding)

1. Use the original full-resolution night/day assets, not the Android recording, as exact visual source.
2. Manually trace the cuff/fist/knuckle silhouettes and add feathered edge detail for fur and gold highlights.
3. Restore occluded jacket/pants texture and the natural shape of the wrist behind the fist in **both themes**.
4. Review **side by side**: original at rest, alpha mask, accurate hand-painted clean plate.
5. Only after approval draw an articulated 4–6 frame restrained castet motion, then check Android Chrome.

No movement, AI event hooks, audio, production UI or `main` changes are allowed in this art-study stage.
