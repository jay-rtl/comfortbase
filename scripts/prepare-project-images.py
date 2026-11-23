"""Generate display copies; never alter the supplied originals.

Usage: python scripts/prepare-project-images.py
Pillow must be available in the Python environment (or PYTHONPATH).
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '.local/source-assets/151-harris-st-pyrmont'
DEST = ROOT / 'assets/projects/151-harris-st-pyrmont'

# Exact supplied filenames, including spaces and punctuation, are preserved here.
GROUPS = {
    'exterior': [('Front.jpg', 'street-frontage', 'Front elevation of the two-storey terrace at 151 Harris St'), ('Front 2.jpg', 'street-frontage-wide', 'Terrace facade and neighbouring buildings along Harris Street'), ('Front 3.jpg', 'street-frontage-detail', 'Iron balcony and front gate of the Harris Street terrace')],
    'living': [('Living.jpg', 'living-fireplace', 'Living room with a timber fireplace, green sofa and cream armchair'), ('Living 2.jpg', 'living-to-dining', 'View from the living room towards the dining table, staircase and kitchen doorway'), ('Living details.jpg', 'fireplace-armchair', 'Timber mantel and arched black fireplace beside a textured cream armchair')],
    'dining': [('Dining.jpg', 'dining-fireplace', 'Dining table beside the original timber fireplace, with the kitchen doorway beyond'), ('Dining 2.jpg', 'dining-staircase', 'Light timber dining table beside the staircase and fireplace'), ('Dining 3.jpg', 'dining-to-living', 'View from the dining room towards the living room and front entrance'), ('Dining 4.jpg', 'dining-mantel', 'Dining setting, pendant light and timber mantel'), ('Dining Living.jpg', 'dining-and-living', 'Connected dining and living rooms with the timber staircase at the side')],
    'kitchen': [('Kitchen.jpg', 'kitchen-overview', 'Kitchen with timber cupboards, a gas cooker and open shelving'), ('Kitchen 2.jpg', 'kitchen-cabinetry', 'Timber kitchen cabinetry and worktop beneath a skylight'), ('Kitchen 3.jpg', 'kitchen-cooker', 'Gas cooker and timber worktop with a coffee machine'), ('Kitchen sink.jpg', 'kitchen-sink', 'Kitchen sink with black tapware and open white shelves')],
    'bedroom': [('Bed .jpg', 'bedroom-balcony', 'Bedroom with timber floors and open doors to the front balcony'), ('Bed 2.jpg', 'bedroom-open-doors', 'Bed and bedside tables beside open balcony doors'), ('Bed 3.jpg', 'bedroom-window', 'Bedroom with a timber-framed window and framed artwork'), ('Bed details.jpg', 'bedroom-window-detail', 'Pillows beneath a timber window looking onto a flowering tree'), ('Bed details .jpg', 'bedroom-linen-detail', 'Layered bed linen beside the open balcony doors')],
    'bathroom': [('Bath.jpg', 'bathroom-overview', 'Tiled bathroom with a bath, glass shower enclosure and white vanity'), ('Bath 2.jpg', 'bathroom-vanity', 'White bathroom basin and mirror against pale tiles'), ('bathub.jpg', 'bath-detail', 'White bath and chrome taps against pale pink tiles'), ('Shower details..jpg', 'shower-detail', 'Chrome shower fittings and tiled border')],
    'outdoor': [('Courtyard.jpg', 'courtyard-seating', 'Brick courtyard with outdoor seating beneath a flowering jacaranda'), ('Courtyard 2.jpg', 'courtyard-tree', 'Courtyard chairs, timber fence and jacaranda branches'), ('Balcony.jpg', 'balcony-ironwork', 'Covered balcony with ornate iron railings overlooking Harris Street')],
    'details': [('Detail shot.jpg', 'jacaranda-detail', 'Purple jacaranda blossoms against a blue sky')],
    'composites': [(f'Dypstitch_{i}.jpg', f'composite-{i}', f'Client-supplied paired project photographs, composition {i}') for i in range(1,6)],
    'before': [('A7R03316.jpg', 'before-street-oblique', 'Before: oblique view of the Harris Street terrace and neighbouring facades'), ('A7R03310.jpg', 'before-street-front', 'Before: front elevation of the Harris Street terrace'), ('A7R03329.jpg', 'before-dining', 'Before: unfurnished dining room with timber staircase, fireplace and kitchen doorway'), ('A7R03313.jpg', 'before-street-wide', 'Before: wider street view of the terrace frontage'), ('A7R03319.jpg', 'before-living', 'Before: unfurnished living room with timber fireplace and doorway towards the kitchen')],
}

records = []
for category, entries in GROUPS.items():
    for filename, slug, alt in entries:
        original = SOURCE / ('before' if category == 'before' else 'completed') / filename
        data = original.read_bytes()
        with Image.open(original) as raw:
            image = ImageOps.exif_transpose(raw).convert('RGB')
            width, height = image.size
            variants = []
            for size in (640, 800, 1280, 1920):
                copy = image.copy()
                copy.thumbnail((size, round(size * height / width)), Image.Resampling.LANCZOS)
                destination = DEST / category / f'{slug}-{size}.webp'
                destination.parent.mkdir(parents=True, exist_ok=True)
                copy.save(destination, 'WEBP', quality=80, method=6)
                variants.append({'width': copy.width, 'height': copy.height, 'src': destination.relative_to(ROOT).as_posix(), 'bytes': destination.stat().st_size})
            avif = []
            if slug == 'living-to-dining':
                for size in (640, 800, 1280, 1920):
                    copy = image.copy()
                    copy.thumbnail((size, round(size * height / width)), Image.Resampling.LANCZOS)
                    destination = DEST / category / f'{slug}-{size}.avif'
                    copy.save(destination, 'AVIF', quality=60, speed=6)
                    avif.append({'width': copy.width, 'height': copy.height, 'src': destination.relative_to(ROOT).as_posix(), 'bytes': destination.stat().st_size})
        records.append({'id': slug, 'category': category, 'original': filename, 'originalSha256': hashlib.sha256(data).hexdigest(), 'originalBytes': len(data), 'width': width, 'height': height, 'alt': alt, 'variants': variants, **({'avif': avif} if avif else {})})

manifest = {'title': '151 Harris St, Pyrmont', 'subtitle': 'A Fresh Perspective on Urban Living', 'source': 'Client-provided completed-property and before-photograph archives', 'originals': '.local/source-assets/151-harris-st-pyrmont', 'images': records}
(ROOT / 'config/project-151-harris-st-pyrmont.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(records)} photographs and {sum(len(r["variants"]) for r in records)} WebP derivatives; originals unchanged.')
