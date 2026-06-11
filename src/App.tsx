import { useState, useEffect } from 'react';
import useDictionary, { DictionaryEntry } from './hooks/useDictionary';
import SearchBar from './components/SearchBar';
import WordDetail from './components/WordDetail';
import LanguageToggle from './components/LanguageToggle';
import { useLanguage } from './contexts/LanguageContext';
import WordCard from './components/WordCard';

const App = () => {
  const { entries, search, fuse } = useDictionary();
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    const storedRecents = localStorage.getItem('recentSearches');
    if (storedRecents) {
      setRecentSearches(JSON.parse(storedRecents));
    }
  }, []);

  const updateRecentSearches = (query: string) => {
    const updatedRecents = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updatedRecents);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecents));
  };

  const handleSearch = (query: string) => {
    if (!fuse) return;
    if (query) {
      const results = fuse.search(query).map(r => r.item);
      setSearchResults(results);
      updateRecentSearches(query);
    } else {
      setSearchResults([]);
    }
    setSelectedEntry(null);
  };
  
  const InitialState = () => (
    <div className="text-center pt-8">
      {recentSearches.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Recent Searches' : '最近搜索'}</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {recentSearches.map(term => (
              <button 
                key={term}
                onClick={() => handleSearch(term)} 
                className="bg-secondary text-secondary-foreground hover:bg-accent px-4 py-2 rounded-lg text-md"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Random Words' : '随机词语'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {entries.slice(0, 4).map(entry => (
              <WordCard key={entry.simplified} entry={entry} onSelect={setSelectedEntry} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold text-primary">Centi</h1>
              <nav className="hidden md:flex items-center space-x-6 text-lg">
                <a href="#" className="font-semibold text-primary">Word</a>
                <a href="#" className="text-muted-foreground hover:text-primary">Hanzi</a>
                <a href="#" className="text-muted-foreground hover:text-primary">Examples</a>
                <a href="#" className="text-muted-foreground hover:text-primary">Stroke</a>
              </nav>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SearchBar onSearch={handleSearch} />
        
        {searchResults.length === 0 ? (
          <InitialState />
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map(entry => (
              <WordCard key={entry.simplified} entry={entry} onSelect={setSelectedEntry} />
            ))}
          </div>
        )}

      </main>

      {selectedEntry && 
        <WordDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      }
    </div>
  );
};

export default App;

