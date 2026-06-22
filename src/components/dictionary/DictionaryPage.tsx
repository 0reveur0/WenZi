import React, { useState, useMemo } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import Tabs from './Tabs';
import Sidebar from './Sidebar';
import WordCard from './WordCard';
import CharacterCard from './CharacterCard';
import { mockWords, mockCharacters } from '../../data/dictionary/mock';

type Tab = 'words' | 'characters';

const DictionaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('words');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWords = useMemo(() => {
    if (!searchQuery) return mockWords;
    return mockWords.filter(
      (word) =>
        word.hanzi.includes(searchQuery) ||
        word.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery) return mockCharacters;
    return mockCharacters.filter(
      (char) =>
        char.hanzi.includes(searchQuery) ||
        char.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'words' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredWords.map((word) => (
                <WordCard key={word.id} {...word} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCharacters.map((char) => (
                <CharacterCard key={char.id} {...char} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DictionaryPage;
