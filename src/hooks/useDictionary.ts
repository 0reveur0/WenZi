import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';

// Temporary data structure for the dictionary entries
export interface DictionaryEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  meanings: string[];
}

const useDictionary = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [fuse, setFuse] = useState<Fuse<DictionaryEntry> | null>(null);

  useEffect(() => {
    fetch('/cedict.json')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setFuse(new Fuse(data, {
          keys: ['simplified', 'traditional', 'pinyin', 'meanings'],
          threshold: 0.3,
        }));
      });
  }, []);

  const search = (query: string) => {
    if (fuse && query) {
      const results = fuse.search(query);
      setEntries(results.map(r => r.item));
    } else {
      // Reset to all entries if the query is empty
      // This might be too slow; we should probably fetch the data again
      fetch('/cedict.json').then(res => res.json()).then(data => setEntries(data));
    }
  };

  return { entries, search };
};

export default useDictionary;
