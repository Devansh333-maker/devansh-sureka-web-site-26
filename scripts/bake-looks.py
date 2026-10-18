"""Bake the avatar's outfit textures ahead of time.

The site used to repaint the outfit texture pixel by pixel in the browser (about a
million pixels per outfit) and rasterise the match kit's cut-out, which stalled the
main thread the first time each outfit appeared. This script does the same work once,
offline, and writes small image files the site simply loads.

    python -I scripts/bake-looks.py

Reads  assets-src/models/devansh-guide.source.glb   (the original Avaturn export)
Writes public/models/avatar/looks/<outfit>.webp     (re-dressed clothes)
       public/models/avatar/looks/kit-alpha.png     (shorts + short sleeves cut-out)

Keep LOOKS / KIT in sync with src/components/character/fabric.ts and kit.ts.
"""
import io
import json
import os
import struct

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src', 'models', 'devansh-guide.source.glb')
OUT = os.path.join(ROOT, 'public', 'models', 'avatar', 'looks')

LOOKS = {
    'arena': {'shirt': ('#30364a', 'sublimated', '#4a5470', False), 'pants': ('#243052', 'knit', None, False), 'darkAsPants': True},
    'notebook': {'shirt': ('#5c2232', 'fleece', None, False), 'pants': ('#2b2d33', 'knit', None, False)},
    'work': {'shirt': ('#c9d8ea', 'plain', None, True), 'pants': ('#33363d', 'knit', None, False)},
    'workshop': {'shirt': ('#9fb3c8', 'plain', None, True)},
}
KIT = {'shortsHem': 0.6, 'sleeveHem': 0.36}


def load_glb(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    return j, b, 20 + n + 8


def accessor(j, b, base, i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    comps = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a['componentType']]
    off = base + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    arr = np.frombuffer(b, dt, count=a['count'] * comps, offset=off)
    return arr.reshape(-1, comps) if comps > 1 else arr


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


def noise(x, y):
    s = np.sin(x * 127.1 + y * 311.7) * 43758.5453
    return s - np.floor(s)


def paint(fab, X, Y, lum):
    base, pattern, accent, keep = fab
    col = np.broadcast_to(rgb(base), X.shape + (3,)).copy()
    k = np.ones(X.shape, np.float32)
    if pattern == 'sublimated':
        band = np.sin((X + Y * 0.55) * 0.045) * 0.5 + 0.5
        fine = (np.mod(X * 0.7 + Y, 9) < 1.4).astype(np.float32)
        m = band * band * 0.55 + fine * band * 0.35
        col = col + (rgb(accent) - col) * m[..., None]
        k *= np.where((X % 3) + (Y % 3) == 0, 0.9, 1.0)
    elif pattern == 'knit':
        k *= 0.94 + np.where((X + (Y // 2)) % 4 == 0, -0.05, 0.0) + noise(X, Y) * 0.08
    elif pattern == 'fleece':
        k *= 0.9 + noise(X * 0.5, Y * 0.5) * 0.16
    if keep:
        k *= 0.55 + 0.45 * lum
    return np.clip(col * k[..., None], 0, 1) * 255


def bake_looks(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    H, W = a.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    r, g, bl = a[..., 0], a[..., 1], a[..., 2]
    s = r + g + bl
    for name, look in LOOKS.items():
        out = a.copy()
        dark = s < (190 if look.get('darkAsPants') else 45)
        denim = dark | ((bl > r + 22) & (bl > 60))
        active = ~dark | bool(look.get('darkAsPants'))
        lum = np.minimum(1, s / 690)
        for part, mask in (('pants', denim & active), ('shirt', ~denim & active)):
            fab = look.get(part)
            if not fab:
                continue
            painted = paint(fab, X, Y, lum)
            out[mask] = np.round(painted[mask])
        Image.fromarray(out.astype(np.uint8)).save(os.path.join(OUT, f'{name}.webp'), quality=90, method=6)
        print('look', name)


def bake_kit_alpha(pos, uv, idx, size=1024):
    mask = np.full((size, size), 255, np.uint8)
    m = 1.2 / size
    tol = -0.08
    for t in range(len(idx) // 3):
        ia = idx[t * 3:t * 3 + 3]
        P = pos[ia]
        U = uv[ia]
        u0, u1 = max(0, int(np.floor((U[:, 0].min() - m) * size))), min(size - 1, int(np.ceil((U[:, 0].max() + m) * size)))
        v0, v1 = max(0, int(np.floor((U[:, 1].min() - m) * size))), min(size - 1, int(np.ceil((U[:, 1].max() + m) * size)))
        if u1 < u0 or v1 < v0:
            continue
        (x0, y0), (x1, y1), (x2, y2) = U
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-12:
            continue
        py, px = np.mgrid[v0:v1 + 1, u0:u1 + 1]
        u = (px + 0.5) / size
        v = (py + 0.5) / size
        a = ((y1 - y2) * (u - x2) + (x2 - x1) * (v - y2)) / den
        bb = ((y2 - y0) * (u - x2) + (x0 - x2) * (v - y2)) / den
        c = 1 - a - bb
        inside = (a >= tol) & (bb >= tol) & (c >= tol)
        X = P[0, 0] * a + P[1, 0] * bb + P[2, 0] * c
        Yh = P[0, 1] * a + P[1, 1] * bb + P[2, 1] * c
        hide = inside & ((Yh < KIT['shortsHem']) | ((np.abs(X) > KIT['sleeveHem']) & (Yh > 1.05)))
        sub = mask[v0:v1 + 1, u0:u1 + 1]
        sub[hide] = 0
    Image.fromarray(mask, 'L').save(os.path.join(OUT, 'kit-alpha.png'), optimize=True)
    print('kit alpha')


def main():
    os.makedirs(OUT, exist_ok=True)
    j, b, base = load_glb(SRC)
    look_mesh = next(m for m in j['meshes'] if 'look' in m['name'])
    prim = look_mesh['primitives'][0]
    mat = j['materials'][prim['material']]
    tex = j['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]
    im = j['images'][tex['source']]
    bv = j['bufferViews'][im['bufferView']]
    data = b[base + bv.get('byteOffset', 0): base + bv.get('byteOffset', 0) + bv['byteLength']]
    bake_looks(Image.open(io.BytesIO(data)))
    pos = accessor(j, b, base, prim['attributes']['POSITION']).astype(np.float64)
    uv = accessor(j, b, base, prim['attributes']['TEXCOORD_0']).astype(np.float64)
    idx = accessor(j, b, base, prim['indices']).astype(np.int64)
    bake_kit_alpha(pos, uv, idx)


if __name__ == '__main__':
    main()
