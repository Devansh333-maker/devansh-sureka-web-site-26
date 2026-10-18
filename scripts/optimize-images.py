"""Shrink the images the site actually shows.

Many posters and infographics are 1–5 MB PNGs straight from design tools. This finds
every raster image referenced by the live pages, writes a WebP no larger than 1800 px
on its long edge into public/opt/ (same folder structure), and points the code at it.
The originals stay where they are.

    python -I scripts/optimize-images.py
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
SOURCES = [
    'src/app',
    'src/components/place',
    'src/components/world',
    'src/content',
]
SKIP = ('/og.png', '/brand/', '/opt/', '/me/')  # already small or generated
REF = re.compile(r"""(['"`])(/[^'"`]+?\.(?:png|jpe?g))\1""", re.I)
MAX = 1800


def convert(ref):
    src = os.path.join(PUBLIC, ref.lstrip('/'))
    if not os.path.isfile(src):
        return None
    out_ref = '/opt' + os.path.splitext(ref)[0] + '.webp'
    out = os.path.join(PUBLIC, out_ref.lstrip('/'))
    if not os.path.isfile(out) or os.path.getmtime(out) < os.path.getmtime(src):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(src)
        im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
        im.thumbnail((MAX, MAX), Image.LANCZOS)
        im.save(out, 'WEBP', quality=82, method=6)
        print(f'{os.path.getsize(src) / 1e6:6.2f} MB -> {os.path.getsize(out) / 1e6:5.2f} MB  {ref}')
    return out_ref


def main():
    for base in SOURCES:
        for dirpath, _, files in os.walk(os.path.join(ROOT, base)):
            for f in files:
                if not f.endswith(('.ts', '.tsx')):
                    continue
                path = os.path.join(dirpath, f)
                text = open(path, encoding='utf8').read()
                changed = text
                for q, ref in set(REF.findall(text)):
                    if ref.startswith(SKIP):
                        continue
                    new = convert(ref)
                    if new:
                        changed = changed.replace(f'{q}{ref}{q}', f'{q}{new}{q}')
                if changed != text:
                    open(path, 'w', encoding='utf8').write(changed)
                    print('updated', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    main()
