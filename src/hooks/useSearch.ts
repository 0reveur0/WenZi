import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { DictionaryEntry } from '../types';

const FUSE_OPTIONS: Fuse.IFuseOptions<DictionaryEntry> = {
  keys: [
    { name: 'simplified', weight: 3 },
    { name: 'traditional', weight: 3 },
    { name: 'pinyinNumbered', weight: 2 },
    { name: 'pinyin', weight: 2 },
    { name: 'meanings', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 1,
  shouldSort: true,
};

const MAX_RESULTS = 100;

export function useSearch(words: DictionaryEntry[], query: string): DictionaryEntry[] {
  const fuse = useMemo(() => new Fuse(words, FUSE_OPTIONS), [words]);

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Exact prefix match gets priority — fast path for Hanzi / Pinyin
    const lowerTrimmed = trimmed.toLowerCase();
    const exactMatches = words.filter(
      (w) =>
        w.simplified.startsWith(trimmed) ||
        w.traditional.startsWith(trimmed) ||
        w.pinyinNumbered.toLowerCase().startsWith(lowerTrimmed) ||
        w.pinyin.toLowerCase().startsWith(lowerTrimmed)
    );

    if (exactMatches.length >= MAX_RESULTS) {
      return exactMatches.slice(0, MAX_RESULTS);
    }

    // Fuzzy fallback for the rest
    const fuzzyResults = fuse
      .search(trimmed, { limit: MAX_RESULTS })
      .map((r) => r.item)
      .filter((item) => !exactMatches.some((e) => e.id === item.id));

    return [...exactMatches, ...fuzzyResults].slice(0, MAX_RESULTS);
  }, [fuse, words, query]);
}
