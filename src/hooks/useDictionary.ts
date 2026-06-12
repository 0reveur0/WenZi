import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';

export interface DictionaryEntry {
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  categories: string[];
}

const useDictionary = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [fuse, setFuse] = useState<Fuse<DictionaryEntry> | null>(null);

  useEffect(() => {
    // Fetch dữ liệu từ điển từ thư mục public
    fetch('/data/words-1.json') // Đường dẫn tuyệt đối từ gốc của thư mục public
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setEntries(data);
        // Khởi tạo Fuse.js sau khi đã có dữ liệu
        setFuse(new Fuse(data, {
          keys: ['hanzi', 'traditional', 'pinyin', 'meaning'],
          includeScore: true,
          threshold: 0.3,
        }));
      })
      .catch(error => console.error('Error fetching dictionary data:', error));
  }, []); // useEffect chỉ chạy một lần khi component được mount

  return { entries, fuse };
};

export default useDictionary;
