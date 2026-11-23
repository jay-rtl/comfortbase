"""Create web playback copies while preserving both supplied master videos.

Requires imageio-ffmpeg on PYTHONPATH. No dependency is needed at site runtime.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '.local/source-assets/151-harris-st-pyrmont/video'
DEST = ROOT / 'assets/projects/151-harris-st-pyrmont/video'
DEST.mkdir(parents=True, exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
records = []
for original, slug, title, seconds in [
    ('151 Harris St, Pyrmont(Airbnb).mp4', 'property-walkthrough', 'A walk through 151 Harris St', 42.80),
    ('151 Harris St, Pyrmont(Before&After).mp4', 'before-and-after', 'Before & after', 73.68),
]:
    source = SOURCE / original
    output = DEST / f'{slug}.mp4'
    poster = DEST / f'{slug}-poster.webp'
    print(f'Preparing {original}', flush=True)
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', str(source), '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', str(output)], check=True)
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', '2', '-i', str(output), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82', str(poster)], check=True)
    # Decode the entire delivery copy, including audio, to detect media errors.
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', str(output), '-f', 'null', '-'], check=True)
    records.append({'title': title, 'original': original, 'originalSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'originalBytes': source.stat().st_size, 'src': output.relative_to(ROOT).as_posix(), 'poster': poster.relative_to(ROOT).as_posix(), 'bytes': output.stat().st_size, 'width': 1280, 'height': 720, 'duration': seconds, 'fullDecodePassed': True})
    print(f'{slug}: {output.stat().st_size:,} bytes; full decode passed', flush=True)
(ROOT / 'config/project-151-harris-st-pyrmont-videos.json').write_text(json.dumps({'source': 'Client-supplied Video archive', 'videos': records}, indent=2) + '\n', encoding='utf-8')
