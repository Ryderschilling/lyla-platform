"""Contact sheets for review: public / club / hq, desktop + mobile mixed."""
from PIL import Image, ImageDraw, ImageFont
import os

SRC = '/home/claude/shots'
OUT = '/home/claude/review'
os.makedirs(OUT, exist_ok=True)

SHEETS = {
    'review-1-public': [
        'home--desktop', 'watch--desktop', 'locker--desktop',
        'the-club--desktop', 'contact--desktop', 'login--desktop',
        'home--mobile', 'watch--mobile', 'locker--mobile', 'the-club--mobile', 'contact--mobile', 'login--mobile',
    ],
    'review-2-club': [
        'club-today--desktop', 'club-past--desktop', 'club-past-detail--desktop',
        'club-progress--desktop', 'club-messages--desktop', 'club-review--desktop',
        'club-locker--desktop', 'club-account--desktop', 'club-complete-gold-moment--desktop',
        'club-review-panel--desktop', 'the-club-demo-interaction--desktop',
        'club-today--mobile', 'club-progress--mobile', 'club-messages--mobile',
    ],
    'review-3-hq': [
        'hq-dashboard--desktop', 'hq-clients--desktop', 'hq-builder--desktop',
        'hq-builder-edit--desktop', 'hq-calendar--desktop', 'hq-reviews--desktop',
        'hq-messages--desktop', 'hq-locker--desktop',
        'hq-dashboard--mobile', 'hq-builder-edit--mobile', 'hq-calendar--mobile', 'hq-messages--mobile',
    ],
}

CELL_W = 640
PAD = 26
LABEL_H = 40
COLS = 3
MAX_CELL_H = 1400
BG = (35, 48, 41)
FG = (242, 236, 223)

try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 20)
except Exception:
    font = ImageFont.load_default()

for sheet, names in SHEETS.items():
    cells = []
    for n in names:
        p = f'{SRC}/{n}.png'
        if not os.path.exists(p):
            continue
        im = Image.open(p)
        w = CELL_W
        h = int(im.height * (w / im.width))
        im = im.resize((w, h), Image.LANCZOS)
        if im.height > MAX_CELL_H:
            im = im.crop((0, 0, w, MAX_CELL_H))
        cells.append((n, im))

    rows = (len(cells) + COLS - 1) // COLS
    row_heights = []
    for r in range(rows):
        row = cells[r * COLS:(r + 1) * COLS]
        row_heights.append(max(im.height for _, im in row) + LABEL_H)

    W = COLS * CELL_W + (COLS + 1) * PAD
    H = sum(row_heights) + (rows + 1) * PAD
    sheet_im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(sheet_im)

    y = PAD
    for r in range(rows):
        row = cells[r * COLS:(r + 1) * COLS]
        for c, (n, im) in enumerate(row):
            x = PAD + c * (CELL_W + PAD)
            d.text((x + 2, y + 6), n.replace('--', ' · ').upper(), fill=FG, font=font)
            sheet_im.paste(im, (x, y + LABEL_H))
        y += row_heights[r] + PAD

    out = f'{OUT}/{sheet}.png'
    sheet_im.save(out, 'PNG', optimize=True)
    print(sheet, sheet_im.size, f'{os.path.getsize(out) // 1024}KB')
