#!/usr/bin/env python3
"""Convierte imágenes JPG/PNG a WebP (calidad 90) junto al original.
Uso:  python3 scripts/a-webp.py foto1.jpg foto2.png ...
      python3 scripts/a-webp.py assets/*.jpg
Requiere: pip install pillow"""
import sys, os
from PIL import Image
if len(sys.argv) < 2:
    sys.exit(__doc__)
for ruta in sys.argv[1:]:
    destino = os.path.splitext(ruta)[0] + '.webp'
    im = Image.open(ruta)
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')  # conserva transparencia de PNG
    im.save(destino, 'WEBP', quality=90, method=6)
    a, d = os.path.getsize(ruta), os.path.getsize(destino)
    print(f'{ruta} ({a//1024} KB) -> {destino} ({d//1024} KB, {100-d*100//a}% menos)')
