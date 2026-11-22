"""Print what appears on each step of a deck (English text only), to write narration/<deck>.json.

Step count per slide matches deck.js maxStep(): max of data-step, data-only, data-reveal, data-steps.
Usage: python3 tools/steps.py 05-logs        (or --check to compare with narration/<deck>.json)
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOID = {'br', 'img', 'input', 'hr', 'meta', 'link', 'use', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop'}


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.items, self.skip = [], [], 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in VOID:
            return
        cls = a.get('class') or ''
        skip = tag in ('style', 'script') or 'fa' in cls.split()
        tagk = None
        for k in ('data-step', 'data-only', 'data-reveal'):
            if k in a:
                tagk = f'{k[5:]} {a[k]}'
        if 'run' in cls.split():
            tagk = (tagk or '') + ' TERMINAL' + (' recall(blurred: viewer types it, revealed at step %s)' % a.get('data-reveal') if 'recall' in cls.split() else '')
        if tag == 'svg':
            skip = True
            self.items.append(((tagk + ' ' if tagk else ''), '[picture]'))
        self.stack.append((tag, skip, tagk))
        if skip:
            self.skip += 1
        if tagk:
            self.items.append((f'\n  <{tagk.strip()}> ', ''))

    def handle_endtag(self, tag):
        while self.stack:
            t, skip, tagk = self.stack.pop()
            if skip:
                self.skip -= 1
            if tagk:
                self.items.append(('', ' </>'))
            if t == tag:
                break

    def handle_data(self, d):
        if not self.skip and d.strip():
            self.items.append(('', ' '.join(d.split())))


def slides_of(deck):
    s = (ROOT / f'{deck}.html').read_text()
    return [sec.split('</section>')[0] for sec in re.split(r'(?=<section class="slide")', s)[1:]]


def max_step(sec):
    n = [int(x) for x in re.findall(r'data-(?:step|reveal)="(\d+)"', sec)]
    n += [int(y) for x in re.findall(r'data-only="([\d ]+)"', sec) for y in x.split()]
    m = re.search(r'data-steps="(\d+)"', sec)
    if m:
        n.append(int(m.group(1)))
    return max(n) if n else 0


deck = sys.argv[1].removesuffix('.html')
secs = slides_of(deck)
if '--check' in sys.argv:
    nar = json.loads((ROOT / 'narration' / f'{deck}.json').read_text())
    ok = len(nar) == len(secs)
    if not ok:
        print(f'{deck}: {len(nar)} slides in json, {len(secs)} in html')
    for i, sec in enumerate(secs):
        want = max_step(sec) + 1
        got = len(nar[i]) if i < len(nar) else None
        if got != want:
            ok = False
            print(f'{deck}: slide {i + 1} needs {want} steps, json has {got}')
    print(f'{deck}: OK' if ok else f'{deck}: MISMATCH')
    sys.exit(0 if ok else 1)

for i, sec in enumerate(secs):
    head = re.match(r'<section[^>]*>', sec).group(0)
    title = re.search(r'data-title-en="([^"]*)"', head)
    scene = re.search(r'data-scene="([^"]*)"', head)
    print(f'\n=== SLIDE {i + 1}: {title.group(1) if title else ""}  | steps 0..{max_step(sec)}'
          + (f'  | animated scene "{scene.group(1)}" (see window.SCENES in the page script for what each step does)' if scene else ''))
    p = P()
    p.feed(sec)
    print(''.join(a + b + ' ' for a, b in p.items).replace(' \n', '\n')[:6000])
