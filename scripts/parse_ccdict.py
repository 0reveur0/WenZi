#!/usr/bin/env python3
"""
Parse CC-CEDICT dictionary file into optimised JSON chunks for Centi frontend.

Usage:
  python scripts/parse_ccdict.py cedict_ts.txt
  python scripts/parse_ccdict.py cedict_ts.txt --out public/data --chunk 25000

Output files written to --out directory:
  words-1.json … words-N.json   (chunked entry data)
  meta.json                      (total count, chunk count)

Place the CC-CEDICT source file (cedict_ts.txt or cedict_ts_*.txt) in the
project root, then run the script. Download from:
  https://www.mdbg.net/chinese/dictionary?page=cc-cedict
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Numbered pinyin → diacritic conversion
# ---------------------------------------------------------------------------

_TONE_MARKS: dict[str, list[str]] = {
    'a': ['ā', 'á', 'ǎ', 'à', 'a'],
    'e': ['ē', 'é', 'ě', 'è', 'e'],
    'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
    'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
    'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
    'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],  # CC-CEDICT uses v for ü
}
_VOWELS = set('aeiouv')


def _place_tone(syllable: str, tone: int) -> str:
    """Apply diacritic tone mark to a single syllable (no trailing digit)."""
    # Rule 1: a or e always takes the mark
    for v in ('a', 'e'):
        if v in syllable:
            return syllable.replace(v, _TONE_MARKS[v][tone - 1], 1)
    # Rule 2: ou → mark on o
    if 'ou' in syllable:
        return syllable.replace('o', _TONE_MARKS['o'][tone - 1], 1)
    # Rule 3: last vowel in the syllable takes the mark
    for i in range(len(syllable) - 1, -1, -1):
        ch = syllable[i]
        if ch in _VOWELS:
            return syllable[:i] + _TONE_MARKS[ch][tone - 1] + syllable[i + 1:]
    return syllable


def numbered_to_diacritic(numbered: str) -> str:
    """Convert full numbered pinyin string to diacritic form.

    'ni3 hao3'     → 'nǐ hǎo'
    'zhong1 guo2'  → 'zhōng guó'
    'r5'           → 'r'
    """
    result = []
    for token in numbered.lower().split():
        if not token:
            continue
        if token == 'r5':
            result.append('r')
            continue
        m = re.match(r'^([a-z:v]+)([1-5])$', token)
        if m:
            syllable, tone_digit = m.group(1), int(m.group(2))
            if tone_digit == 5:
                result.append(syllable.replace('v', 'ü'))
            else:
                result.append(_place_tone(syllable, tone_digit))
        else:
            result.append(token)
    return ' '.join(result)


# ---------------------------------------------------------------------------
# CC-CEDICT line parser
# ---------------------------------------------------------------------------

_LINE_RE = re.compile(
    r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$'
)
_CL_RE = re.compile(r'CL:([^\[/]+)')


def _extract_classifiers(meanings: list[str]) -> tuple[list[str], list[str]]:
    """Separate CL: entries from regular meanings; return (meanings, classifiers)."""
    classifiers: list[str] = []
    filtered: list[str] = []
    for m in meanings:
        if m.startswith('CL:'):
            raw = _CL_RE.search(m)
            if raw:
                for part in raw.group(1).split(','):
                    char = re.sub(r'\|.*', '', part.strip())
                    if char:
                        classifiers.append(char)
        else:
            filtered.append(m)
    return filtered, classifiers


def parse_line(line: str) -> dict | None:
    line = line.strip()
    if not line or line.startswith('#'):
        return None
    m = _LINE_RE.match(line)
    if not m:
        return None
    traditional, simplified, pinyin_raw, defs_raw = m.groups()
    meanings_raw = [d.strip() for d in defs_raw.split('/') if d.strip()]
    meanings, classifiers = _extract_classifiers(meanings_raw)
    if not meanings:
        meanings = meanings_raw  # fallback if everything was a classifier
    return {
        'traditional': traditional,
        'simplified': simplified,
        'pinyinNumbered': pinyin_raw.strip(),
        'pinyin': numbered_to_diacritic(pinyin_raw.strip()),
        'meanings': meanings,
        'classifiers': classifiers if classifiers else None,
    }


def should_keep(entry: dict) -> bool:
    """Basic quality filter to remove very low-quality entries."""
    if not entry['simplified'] or not entry['meanings']:
        return False
    # Skip purely variant / rare single-char entries
    if len(entry['simplified']) == 1 and len(entry['meanings']) == 1:
        m = entry['meanings'][0].lower()
        if 'variant of' in m or 'old variant' in m:
            return False
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description='Parse CC-CEDICT into JSON chunks')
    parser.add_argument('input', nargs='?', help='Path to cedict_ts.txt (optional; auto-detected if omitted)')
    parser.add_argument('--out', default='public/data', help='Output directory (default: public/data)')
    parser.add_argument('--chunk', type=int, default=25000, help='Entries per chunk (default: 25000)')
    parser.add_argument('--max', type=int, default=120000, help='Max entries to keep (default: 120000)')
    args = parser.parse_args()

    # Auto-detect input file
    if args.input:
        candidates = [Path(args.input)]
    else:
        root = Path(__file__).resolve().parent.parent
        candidates = sorted(root.glob('cedict_ts*.txt')) + sorted(root.glob('cedict_ts*.txt.gz'))

    if not candidates or not candidates[0].exists():
        print('ERROR: CC-CEDICT source file not found.')
        print('Download it from https://www.mdbg.net/chinese/dictionary?page=cc-cedict')
        print('and place cedict_ts.txt in the project root, then re-run this script.')
        sys.exit(1)

    input_path = candidates[0]
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f'Parsing {input_path} …')
    entries: list[dict] = []
    seen: set[str] = set()

    open_fn: any
    if input_path.suffix == '.gz':
        import gzip
        open_fn = lambda: gzip.open(input_path, 'rt', encoding='utf-8')
    else:
        open_fn = lambda: open(input_path, encoding='utf-8')

    with open_fn() as fh:
        for line in fh:
            if len(entries) >= args.max:
                break
            parsed = parse_line(line)
            if not parsed or not should_keep(parsed):
                continue
            key = f"{parsed['simplified']}|{parsed['pinyinNumbered']}"
            if key in seen:
                continue
            seen.add(key)
            parsed['id'] = len(entries) + 1
            entries.append(parsed)

    print(f'Parsed {len(entries)} entries.')

    # Write chunks
    chunk_size = args.chunk
    chunks = [entries[i:i + chunk_size] for i in range(0, len(entries), chunk_size)]
    for idx, chunk in enumerate(chunks, start=1):
        path = out_dir / f'words-{idx}.json'
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(chunk, fh, ensure_ascii=False, separators=(',', ':'))
        kb = path.stat().st_size // 1024
        print(f'  {path.name}  ({len(chunk)} entries, {kb} KB)')

    meta = {
        'totalEntries': len(entries),
        'chunkCount': len(chunks),
        'chunkSize': chunk_size,
    }
    meta_path = out_dir / 'meta.json'
    with open(meta_path, 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)

    print(f'  meta.json  →  {len(chunks)} chunk(s), {len(entries)} total entries')
    print('Done. Copy public/data/ to your static hosting or leave it for Vite to serve.')


if __name__ == '__main__':
    main()
