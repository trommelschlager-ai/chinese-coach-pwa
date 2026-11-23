"""Compose source-pixel artwork for the isolated R4 motion review."""
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
SIZE = (693, 1444)
# Hand-traced over a 2x view of the original crop at (120, 690).
ARM = [(7,204),(22,154),(55,126),(102,103),(152,96),(180,101),
       (203,114),(222,141),(237,148),(259,154),(276,161),(286,172),
       (306,182),(336,194),(359,206),(382,222),(401,242),(414,260),
       (424,278),(429,293),(438,302),(445,317),(443,338),(434,352),
       (421,362),(410,365),(403,378),(389,385),(374,385),(366,395),
       (350,401),(337,398),(324,389),(309,389),(295,380),(285,367),
       (278,346),(268,330),(255,314),(244,297),(229,280),(211,272),
       (191,272),(165,277),(142,283),(118,289),(90,288),(57,281),
       (30,262),(13,240)]
FIST = [(291,166),(272,164),(252,177),(238,200),(228,227),(228,256),
        (241,288),(268,333),(282,385),(321,410),(379,414),(440,381),
        (456,350),(455,283),(420,209),(335,161)]
CUFF = [(0,95),(155,87),(214,116),(211,143),(177,139),(150,145),
        (124,159),(105,183),(90,213),(86,244),(96,271),(120,295),(0,301)]
# Explicit positions for each beat, from rest through return.
# Times are frame counts at 30 fps.
POSES = [(0,0,6),(0,-2,5),(1,-5,6),
         (2,-8,11),(1,-4,8),(0,0,9)]


def mask(points):
    canvas = Image.new('L', (SIZE[0]*2, SIZE[1]*2))
    ImageDraw.Draw(canvas).polygon([(240+x, 1380+y) for x,y in points], fill=255)
    return np.array(canvas.resize(SIZE, Image.Resampling.LANCZOS))


def rgba(rgb, alpha):
    result = rgb.convert('RGBA')
    result.putalpha(Image.fromarray(alpha))
    result.paste((0, 0, 0, 0), (0, 0, *SIZE), Image.fromarray((alpha == 0).astype("uint8") * 255))
    return result


def move(layer, dx, dy):
    result = Image.new('RGBA', SIZE)
    result.paste(layer, (dx, dy))
    return result


def restore(source, silhouette):
    # Texture clone strokes. Anchors follow the visible trouser fold below
    # the knuckles and the black shirt above/right of the forearm.
    pixels = np.array(source)
    y, x = np.indices(silhouette.shape)
    # Mirror garment texture immediately outside each side of the mask.
    # Sample deeper below the gold contour to exclude its reflected edge.
    opaque = silhouette > 10
    bottom = np.where(opaque, y, 0).max(axis=0)[None, :]
    top = np.where(opaque, y, SIZE[1]).min(axis=0)[None, :]
    below_y = np.clip(bottom + 3 + np.abs(bottom-y), 0, SIZE[1]-1)
    above_y = np.clip(top - 3 - np.abs(top-y), 0, SIZE[1]-1)
    below = pixels[below_y, x]
    above = pixels[above_y, x]
    side = ((y - top) >= (bottom - y)).astype('uint8') * 255
    blend = np.array(Image.fromarray(side).filter(ImageFilter.GaussianBlur(2)),
                     dtype=float)[...,None]/255
    clone = Image.fromarray(np.round(below*blend+above*(1-blend)).astype('uint8'))
    return rgba(clone, silhouette)


def render(video):
    strip = Image.new('RGB', (6*244, 2*238), '#181818')
    labels = ImageDraw.Draw(strip)
    with tempfile.TemporaryDirectory() as directory:
        temp = Path(directory)
        sequence = 0
        for row, theme in enumerate(('night', 'day')):
            source = Image.open(HERE.parent.parent / 'assets' /
                                'panda-street-day-night' / f'{theme}.webp').convert('RGB')
            assert source.size == SIZE
            target = HERE / theme
            target.mkdir(exist_ok=True)
            outline = mask(ARM)
            # The arm/sleeve seam is inside dark leather. Gradually reduce
            # the movement toward the fixed sleeve instead of cutting a notch.
            y, x = np.indices(outline.shape)
            ramp = np.clip((x-150)/58, 0, 1)
            arm = np.rint(outline*ramp).astype('uint8')
            fist = np.minimum(arm, mask(FIST))
            cuff = np.minimum(arm-fist, mask(CUFF))
            forearm = arm-fist-cuff
            allowance = np.array(Image.fromarray(outline).filter(ImageFilter.MaxFilter(7)))
            cover = np.maximum(arm, np.rint(allowance*ramp).astype('uint8'))
            plate = restore(source, cover)
            for name, layer in (
                ('fist', rgba(source, fist)), ('forearm', rgba(source, forearm)),
                ('cuff', rgba(source, cuff)), ('stationary', rgba(source, 255-arm)),
                ('clean-plate', plate),
            ):
                layer.save(target / f'{name}.png', optimize=True)
            opaque_fist = rgba(source, fist)
            coupled = rgba(source, arm)
            full_base = Image.alpha_composite(source.convert('RGBA'), plate)
            original = np.array(source)
            def compose(dx, dy):
                if dy:
                    # Keep forearm and fist coupled across the watch seam.
                    frame = Image.alpha_composite(full_base, move(coupled, dx, dy)).convert('RGB')
                else:
                    frame = source
                result = np.array(frame)
                region = (slice(725, 910), slice(130, 361))
                changed = np.any(result != original, axis=2)
                changed[region] = False
                assert not changed.any(), (theme, dx, dy)
                assert dy or np.array_equal(result, original)
                if dy:
                    core = np.array(opaque_fist.getchannel('A')) == 255
                    ys, xs = np.where(core)
                    assert np.array_equal(result[ys+dy, xs+dx], original[ys,xs])
                return frame

            cached = {}
            for index, (*position, frames) in enumerate(POSES, 1):
                frame = compose(*position)
                frame.save(target / f'pose-{index:02}.png', optimize=True)
                detail = frame.crop((127, 731, 371, 945))
                strip.paste(detail, ((index-1)*244, row*238+23))
                labels.text(((index-1)*244+7, row*238+4), f'{theme} / pose {index}')
                following = POSES[min(index, len(POSES)-1)][:2]
                for tick in range(frames):
                    progress = tick / frames
                    if index == 4:
                        progress = max(0, (tick - 7) / (frames - 7))
                    blend = progress * progress * (3 - 2 * progress)
                    key = tuple(round(a + (b-a)*blend) for a,b in zip(position, following))
                    if key not in cached:
                        path = temp / f'{theme}-{len(cached)}.png'
                        compose(*key).save(path, compress_level=1)
                        cached[key] = path
                    (temp / f'{sequence:03}.png').symlink_to(cached[key])
                    sequence += 1
        strip.save(HERE / 'contact-sheet.jpg', quality=94)
        if video:
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30',
                '-i', str(temp / '%03d.png'), '-vf', 'pad=694:1444:0:0:color=black',
                '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart', str(HERE / 'panda-street-r4.mp4'),
            ], check=True)


if __name__ == '__main__':
    render(video=True)
