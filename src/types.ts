export interface DictionaryEntry {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinNumbered: string;
  meanings: string[];
  classifiers?: string[] | null;
  frequency?: number | null;
}

export interface DictionaryMeta {
  totalEntries: number;
  chunkCount: number;
  chunkSize: number;
}
