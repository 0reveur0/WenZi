import { useEffect, useState } from 'react';
import type { DictionaryEntry, DictionaryMeta } from '../types';

export interface DictionaryState {
  words: DictionaryEntry[];
  loading: boolean;
  error: string | null;
  progress: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json() as Promise<T>;
}

export function useDictionary(): DictionaryState {
  const [state, setState] = useState<DictionaryState>({
    words: [],
    loading: true,
    error: null,
    progress: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const meta = await fetchJson<DictionaryMeta>('/data/meta.json');
        if (cancelled) return;

        const allWords: DictionaryEntry[] = [];
        for (let i = 1; i <= meta.chunkCount; i++) {
          const chunk = await fetchJson<DictionaryEntry[]>(`/data/words-${i}.json`);
          if (cancelled) return;
          allWords.push(...chunk);
          setState((prev) => ({
            ...prev,
            progress: Math.round((i / meta.chunkCount) * 100),
          }));
        }

        setState({ words: allWords, loading: false, error: null, progress: 100 });
      } catch (err) {
        if (cancelled) return;
        setState({ words: [], loading: false, error: String(err), progress: 0 });
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
