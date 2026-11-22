"""Voice the slide narration with Kokoro-82M.

narration/<deck>.json is a list of slides; each slide is a list of step texts
(index = step number, "" = no voice for that step). For every non-empty step this
writes audio/<deck>/sNN-K.mp3 and audio/<deck>/index.js, which deck.js loads.
Clips whose text did not change are kept, so re-running is cheap.

Usage: <venv with kokoro>/bin/python tools/narrate.py [deck ...] [--voice af_heart] [--speed 1.0] [--force]
       (no deck = every file in narration/)
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 24000

ap = argparse.ArgumentParser()
ap.add_argument('decks', nargs='*')
ap.add_argument('--voice', default='af_heart')
ap.add_argument('--speed', type=float, default=1.0)
ap.add_argument('--force', action='store_true')
args = ap.parse_args()

decks = args.decks or sorted(p.stem for p in (ROOT / 'narration').glob('*.json'))
_pipeline = None


def speak(text):
    global _pipeline
    if _pipeline is None:
        from kokoro import KPipeline
        _pipeline = KPipeline(lang_code=args.voice[0], repo_id='hexgrad/Kokoro-82M')
    chunks = [a.numpy() if hasattr(a, 'numpy') else a for _, _, a in _pipeline(text, voice=args.voice, speed=args.speed)]
    audio = np.concatenate(chunks)
    loud = np.flatnonzero(np.abs(audio) > 0.01)
    return audio[max(loud[0] - 600, 0): loud[-1] + 2400] if loud.size else audio


for deck in decks:
    slides = json.loads((ROOT / 'narration' / f'{deck}.json').read_text())
    out = ROOT / 'audio' / deck
    out.mkdir(parents=True, exist_ok=True)
    meta_path = out / 'meta.json'  # text hashes, to skip unchanged clips
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    keep, durs, new_meta = set(), [], {}
    for si, steps in enumerate(slides):
        row = []
        for k, text in enumerate(steps):
            text = text.strip()
            if not text:
                row.append(0)
                continue
            name = f's{si + 1:02d}-{k}.mp3'
            h = hashlib.sha1(f'{args.voice}|{args.speed}|{text}'.encode()).hexdigest()[:16]
            if args.force or meta.get(name, {}).get('h') != h or not (out / name).exists():
                audio = speak(text)
                with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
                    sf.write(wav.name, audio, SR)
                    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav.name, '-ac', '1', '-b:a', '64k', str(out / name)], check=True)
                dur = round(len(audio) / SR, 2)
                print(f'{deck} {name} {dur}s')
            else:
                dur = meta[name]['d']
            new_meta[name] = {'h': h, 'd': dur}
            keep.add(name)
            row.append(dur)
        durs.append(row)
    for f in out.glob('*.mp3'):
        if f.name not in keep:
            f.unlink()
    meta_path.write_text(json.dumps(new_meta, indent=1))
    (out / 'index.js').write_text(f'window.NARRATION = {json.dumps(durs)};\n')
    print(f'{deck}: {len(keep)} clips')
