import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { DictionaryEntry } from './useDictionary';

// Custom hook to perform a search on the dictionary
const useSearch = (entries: DictionaryEntry[], query: string) => {
  const fuse = useMemo(() => {
    const options = {
      keys: ['simplified', 'pinyin', 'meanings'],
      includeScore: true,
      threshold: 0.3, // Adjust this to fine-tune search sensitivity
    };
    return new Fuse(entries, options);
  }, [entries]);

  return useMemo(() => {
    if (!query) {
      return [];
    }
    return fuse.search(query).map((result) => result.item);
  }, [fuse, query]);
};

export default useSearch;
