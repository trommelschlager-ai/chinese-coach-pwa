#!/usr/bin/env python3
"""Crop only the approved Panda Go panda/logo hero from the original raster.

The original v136 image contains a *printed* "Звуки и тоны" button below the
panda, which must not appear behind the six real HSK controls.
The cropped derivative excludes the baked controls rather than covering them
with a mismatched gradient. No new characters or backgrounds are generated.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source=root/'assets/panda-go-home-v136-clean.png'
output=root/'assets/panda-go-panda-only-v173.webp'
with Image.open(source) as image:
    if image.width < 400 or image.height < 700:
        raise SystemExit(f'Unexpected approved source dimensions: {image.size}')
    # Keep the logo, temple, sky, flowers and the full panda; cut before the
    # pre-painted extra course button starts at ~35% of source image height.
    cutoff=round(image.height*0.326)
    cropped=image.convert('RGB').crop((0,0,image.width,cutoff))
    cropped.save(output,'WEBP',quality=95,method=6)
    print('Cropped approved hero',image.size,'=>',cropped.size,output.stat().st_size,'bytes')
    if output.stat().st_size > 1900000:
        raise SystemExit('Hero image too large for an offline mobile course')

# The existing map art contains a large panda PRINTED across the left side
# of the landscape. Use the right-hand scenic composition, so the only panda
# in the HSK map is the separate actual PNG/SVG at the bottom of the trail.
map_source=root/'assets/approved-panda-lake-v112.webp'
map_output=root/'assets/panda-hsk1-landscape-clean-v173.webp'
with Image.open(map_source) as image:
    # Crop away the left 32% where the old landscape has a painted giant panda.
    offset=round(image.width*0.32)
    target_width=image.width-offset
    scene=image.convert('RGB').crop((offset,0,image.width,image.height))
    scene.save(map_output,'WEBP',quality=93,method=6)
    print('Cropped approved scenic map',image.size,'=>',scene.size,
          'left crop',offset,'bytes',map_output.stat().st_size)
    if map_output.stat().st_size>1900000:
        raise SystemExit('Scenic map too large for offline mobile course')
