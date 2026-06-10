#!/usr/bin/env python3
from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Dict, List

CEDICT_PATTERN = re.compile(
    r'^(?P<traditional>\S+)\s+(?P<simplified>\S+)\s+\[(?P<pinyin>[^\]]+)\]\s+/(?P<definitions>.+)/$'
)
CLASSIFIER_PATTERN = re.compile(r'\(CL:\s*([^\)]+)\)')

TONE_MAP = {
    'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4', 'a': 'a5',
    'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4', 'e': 'e5',
    'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4', 'i': 'i5',
    'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4', 'o': 'o5',
    'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4', 'u': 'u5',
    'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4', 'ü': 'v5', 'v': 'v5',
    'ń': 'n2', 'ň': 'n3', 'ǹ': 'n4', 'm̄': 'm1', 'ḿ': 'm2'
}


def pinyin_numbered(token: str) -> str:
    tone = '5'
    parts = []
    for char in token:
        if char in TONE_MAP:
            mapping = TONE_MAP[char]
            if mapping[-1] in '12345':
                tone = mapping[-1]
            parts.append(mapping[:-1])
        else:
            parts.append(char)

    joined = ''.join(parts)
    if tone != '5':
        return f'{joined}{tone}'
    return f'{joined}5'


def normalize_pinyin(pinyin: str) -> str:
    tokens = pinyin.replace('ü', 'v').split()
    return ' '.join(pinyin_numbered(token) for token in tokens)


def extract_classifiers(definitions: str) -> tuple[List[str], str]:
    classifiers: List[str] = []
    cleaned = definitions
    for match in CLASSIFIER_PATTERN.finditer(definitions):
        classifier_text = match.group(1).strip()
        classifiers.extend([c.strip() for c in classifier_text.split(',') if c.strip()])
        cleaned = cleaned.replace(match.group(0), '')
    return classifiers, cleaned.strip()


def parse_line(line: str) -> Dict | None:
    line = line.strip()
    if not line or line.startswith('#'):
        return None

    match = CEDICT_PATTERN.match(line)
    if not match:
        return None

    simplified = match.group('simplified')
    traditional = match.group('traditional')
    pinyin = match.group('pinyin').strip()
    definitions = match.group('definitions').strip()

    classifiers, cleaned = extract_classifiers(definitions)
    meanings = [meaning.strip() for meaning in cleaned.split('/') if meaning.strip()]

    if len(simplified) < 2 or not meanings:
        return None

    return {
        'simplified': simplified,
        'traditional': traditional,
        'pinyin': pinyin,
        'pinyinNumbered': normalize_pinyin(pinyin),
        'meanings': meanings,
        'classifiers': classifiers or None,
        'frequency': None
    }


def build_index(entries: List[Dict], output_dir: Path, chunk_size: int = 5000) -> None:
    index_entries = []
    chunk_files = []

    for chunk_id in range(0, len(entries), chunk_size):
        chunk = entries[chunk_id:chunk_id + chunk_size]
        chunk_file = output_dir / f'words-{chunk_id // chunk_size}.json'
        with chunk_file.open('w', encoding='utf-8') as handle:
            json.dump(chunk, handle, ensure_ascii=False, indent=2)
        chunk_files.append(chunk_file.name)

    for idx, entry in enumerate(entries):
        item = {**entry, 'id': idx}
        index_entries.append(item)

    dictionary_index = {
        'chunks': chunk_files,
        'entries': index_entries
    }

    with (output_dir / 'dictionary-index.json').open('w', encoding='utf-8') as handle:
        json.dump(dictionary_index, handle, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    source_dir = Path(__file__).resolve().parents[1]
    data_dir = source_dir / 'src' / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)

    candidates = list(source_dir.glob('cedict_ts_*.txt')) + list(source_dir.glob('cedict_ts_*.txt.gz'))
    if not candidates:
        raise FileNotFoundError('Không tìm thấy file CC-CEDICT cedict_ts_*.txt trong thư mục dự án.')

    entries = []
    seen = set()
    limit = 120000

    for path in sorted(candidates):
        open_fn = path.open
        if path.suffix == '.gz':
            import gzip
            open_fn = lambda *args, **kwargs: gzip.open(path, *args, **kwargs, encoding='utf-8')

        with open_fn('r', encoding='utf-8') as handle:
            for line in handle:
                parsed = parse_line(line)
                if not parsed:
                    continue
                key = f"{parsed['simplified']}|{parsed['traditional']}|{parsed['pinyin']}"
                if key in seen:
                    continue
                seen.add(key)
                entries.append(parsed)
                if len(entries) >= limit:
                    break
        if len(entries) >= limit:
            break

    print(f'Parsed {len(entries)} entries from CC-CEDICT source.')
    build_index(entries, data_dir, chunk_size=5000)
    print(f'Wrote dictionary-index.json and {len(entries) // 5000 + 1} chunk files to {data_dir}')
