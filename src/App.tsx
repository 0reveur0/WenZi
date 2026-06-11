import { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import HanziStroke from './components/HanziStroke';
import Cedict from './cedict.json';

// A dictionary entry
export interface DictionaryEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  definition: string;
}

function App() {
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [selected, setSelected] = useState<DictionaryEntry | null>(null);

  // This function will be called when the user searches for a word
  const onSearch = (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchResults = Cedict.filter(
      (entry) =>
        entry.simplified.includes(query) ||
        entry.traditional.includes(query) ||
        entry.pinyin.includes(query)
    );

    setResults(searchResults);
  };

  return (
    <div className="App">
      <SearchBar onSearch={onSearch} />
      {results.length > 0 && (
        <ResultsList results={results} onSelect={setSelected} />
      )}
      {selected && <HanziStroke character={selected.simplified} />}
    </div>
  );
}

export default App;
