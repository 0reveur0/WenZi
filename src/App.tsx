import { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import WordDetail from './components/WordDetail';
import useDictionary, { DictionaryEntry } from './hooks/useDictionary';
import useSearch from './hooks/useSearch';
import useDebouncedValue from './hooks/useDebouncedValue';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { entries, loading } = useDictionary();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DictionaryEntry | null>(null);
  
  const debouncedQuery = useDebouncedValue(query, 300); // Debounce search query by 300ms
  const searchResults = useSearch(entries, debouncedQuery);

  return (
    <div className="App">
      <SearchBar query={query} onQueryChange={setQuery} />
      {loading && <LoadingSpinner />}
      {!loading && (
        <>
          <ResultsList results={searchResults} onSelect={setSelected} />
          {selected && <WordDetail entry={selected} />}
        </>
      )}
    </div>
  );
}

export default App;
