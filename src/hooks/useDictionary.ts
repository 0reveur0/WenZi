'''import { useState, useEffect } from 'react';

// Define the structure of a dictionary entry, mirroring the Python script's output
export interface DictionaryEntry {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinNumbered: string;
  meanings: string[];
  classifiers?: string[];
}

// Define the structure of the metadata file
interface DictionaryMeta {
  totalEntries: number;
  chunkCount: number;
  chunkSize: number;
}

// Custom hook to load the dictionary data
const useDictionary = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        setLoading(true);
        // Fetch the metadata to know how many chunks to load
        const metaResponse = await fetch('/data/meta.json');
        const meta: DictionaryMeta = await metaResponse.json();

        // Fetch all word chunks in parallel
        const chunkPromises = [];
        for (let i = 1; i <= meta.chunkCount; i++) {
          chunkPromises.push(fetch(`/data/words-${i}.json`).then((res) => res.json()));
        }

        // Wait for all chunks to be loaded
        const allChunks = await Promise.all(chunkPromises);
        
        // Combine the chunks into a single array
        const allEntries = allChunks.flat();

        setEntries(allEntries);
      } catch (error) {
        console.error("Failed to load dictionary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDictionary();
  }, []);

  return { entries, loading };
};

export default useDictionary;
''