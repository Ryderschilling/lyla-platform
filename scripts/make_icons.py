"""
PWA icons for both surfaces — 4x render + Lanczos downscale, solid bg, 10% padding, RGB.
Marketing: shell bg + coral sun. Club: dark #141E1A bg + coral rise (packet app icon).
"""
from PIL import Image, ImageDraw
import math

SHELL = (247, 241, 230)
INK = (35, 48, 41)
CORAL = (222, 122, 82)
NIGHT = (20, 30, 26)

S = 2048  # render size


def rline(d, x1, y1, x2, y2, w, fill):
    d.line([(x1, y1), (x2, y2)], fill=fill, width=w)
    r = w / 2
    for (x, y) in ((x1, y1), (x2, y2)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def draw_sun(bg, color):
    img = Image.new('RGB', (S, S), bg)
    d = ImageDraw.Draw(img)
    pad = 0.10 * S
    box = S - 2 * pad  # glyph area (viewBox 100 -> box)
    u = box / 100.0
    cx = cy = S / 2
    stroke = int(4.2 * u)
    r_circle = 19.5 * u
    d.ellipse([cx - r_circle, cy - r_circle, cx + r_circle, cy + r_circle], outline=color, width=stroke)
    # 12 rays: from radius 31 to 47 (viewBox units), every 30 deg
    for i in range(12):
        a = math.radians(i * 30)
        x1 = cx + math.cos(a) * 31 * u
        y1 = cy + math.sin(a) * 31 * u
        x2 = cx + math.cos(a) * 47 * u
        y2 = cy + math.sin(a) * 47 * u
        rline(d, x1, y1, x2, y2, stroke, color)
    return img


def draw_rise(bg, color):
    img = Image.new('RGB', (S, S), bg)
    d = ImageDraw.Draw(img)
    pad = 0.14 * S
    box = S - 2 * pad
    u = box / 100.0  # viewBox 100x80 mapped on width
    ox = pad
    oy = (S - 80 * u) / 2
    stroke = int(5.0 * u)
    # dome: filled half circle, radius 28, center (50, 70)
    cx = ox + 50 * u
    cy = oy + 70 * u
    r = 28 * u
    d.pieslice([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=color)
    # horizon line 4..96 at y 70
    rline(d, ox + 4 * u, cy, ox + 96 * u, cy, stroke, color)
    # rays
    rline(d, ox + 50 * u, oy + 34 * u, ox + 50 * u, oy + 22 * u, stroke, color)
    rline(d, ox + 28 * u, oy + 42 * u, ox + 20 * u, oy + 34 * u, stroke, color)
    rline(d, ox + 72 * u, oy + 42 * u, ox + 80 * u, oy + 34 * u, stroke, color)
    return img


def save_set(img, prefix, sizes):
    for name, size in sizes:
        img.resize((size, size), Image.LANCZOS).save(f'public/{prefix}{name}', 'PNG')


sun = draw_sun(SHELL, CORAL)
save_set(sun, '', [('favicon-32.png', 32), ('favicon-192.png', 192), ('favicon-512.png', 512), ('apple-touch-icon.png', 180)])

rise = draw_rise(NIGHT, CORAL)
save_set(rise, 'club-', [('favicon-192.png', 192), ('favicon-512.png', 512), ('apple-touch-icon.png', 180)])

print('icons written')
