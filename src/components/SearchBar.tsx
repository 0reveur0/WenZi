import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mic, Pen, Search } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const { language } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const placeholder = language === 'en' 
    ? "Search Hanzi / Pinyin / English"
    : "搜索汉字 / Pinyin";

  const hotSearches = ['你好', '谢谢', '爱', '学习', '中国'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search />
        </div>
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-input text-foreground pl-14 pr-24 py-4 text-lg rounded-full border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-4">
          <button type="button" className="text-muted-foreground hover:text-primary">
            <Mic />
          </button>
          <button type="button" className="text-muted-foreground hover:text-primary">
            <Pen />
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center space-x-4">
        <span className="text-muted-foreground">{language === 'en' ? 'Hot Search:' : '热门搜索:'}</span>
        {hotSearches.map((term) => (
          <button 
            key={term}
            onClick={() => onSearch(term)} 
            className="bg-secondary text-secondary-foreground hover:bg-accent px-3 py-1 rounded-full text-sm"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
