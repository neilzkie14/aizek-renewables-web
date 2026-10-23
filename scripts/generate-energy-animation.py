"""Create deterministic rotating GIF and WebP assets from the supplied artwork.

Requires Pillow. Run from the repository root with:
    python3 scripts/generate-energy-animation.py
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'images'
source = Image.open(assets / 'energy-orb-still.jpg').convert('RGB')
source = source.resize((360, 360), Image.Resampling.LANCZOS)
palette = source.quantize(colors=128, dither=Image.Dither.NONE)
frames = [
    source.rotate(-index * 360 / 96, resample=Image.Resampling.BICUBIC, fillcolor=(0, 0, 0))
    for index in range(96)
]
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(
    assets / 'energy-orb-rotating.gif', save_all=True, append_images=indexed[1:],
    duration=100, loop=0, disposal=2, optimize=True,
)
frames[0].save(
    assets / 'energy-orb-rotating.webp', save_all=True, append_images=frames[1:],
    duration=100, loop=0, quality=75, method=4,
)
for name in ['energy-orb-rotating.gif', 'energy-orb-rotating.webp']:
    path = assets / name
    with Image.open(path) as animation:
        print(f'{name}: {animation.n_frames} frames, {path.stat().st_size / 1024:.0f} KB')
