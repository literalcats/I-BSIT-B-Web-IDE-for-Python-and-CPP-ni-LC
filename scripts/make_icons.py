"""Draws the app icons (the ">_" terminal prompt on a dark tile).

Run it only if you want to change the look of the icons:
    pip install pillow
    python scripts/make_icons.py

The finished PNG files are already in public/icons/, so you normally don't need this.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (31, 33, 35)        # dark gray tile
GREEN = (46, 160, 67)    # forest-green prompt
SCALE = 4                # draw 4x bigger, then shrink = smooth edges


def draw_icon(size, rounded, glyph_scale=1.0):
    """Return a size x size image with the ">_" prompt."""
    big = size * SCALE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, big, big], fill=BG)  # maskable: fill everything, the OS crops it

    # The ">" chevron: two thick lines meeting at a point.
    s = big * glyph_scale
    cx, cy = big / 2, big / 2
    w = int(s * 0.075)  # line thickness
    left, right = cx - s * 0.24, cx - s * 0.02
    top, bottom = cy - s * 0.2, cy + s * 0.2
    d.line([(left, top), (right, cy)], fill=GREEN, width=w, joint="curve")
    d.line([(right, cy), (left, bottom)], fill=GREEN, width=w, joint="curve")
    for x, y in [(left, top), (right, cy), (left, bottom)]:  # round the line ends
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=GREEN)

    # The "_" underscore.
    d.rounded_rectangle(
        [cx + s * 0.06, cy + s * 0.2 - w / 2, cx + s * 0.3, cy + s * 0.2 + w / 2],
        radius=w // 2,
        fill=GREEN,
    )
    return img.resize((size, size), Image.LANCZOS)


draw_icon(192, rounded=True).save(OUT / "icon-192.png")
draw_icon(512, rounded=True).save(OUT / "icon-512.png")
draw_icon(180, rounded=False, glyph_scale=0.9).save(OUT / "apple-touch-icon.png")
draw_icon(512, rounded=False, glyph_scale=0.7).save(OUT / "icon-maskable-512.png")
print("Icons written to", OUT)
