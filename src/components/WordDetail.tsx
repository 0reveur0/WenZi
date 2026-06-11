import { useState } from 'react';
import { DictionaryEntry } from "../hooks/useDictionary";
import HanziStroke from "./HanziStroke";
import { useLanguage } from "../contexts/LanguageContext";

interface WordDetailProps {
  entry: DictionaryEntry | null;
  onClose: () => void;
}

const WordDetail = ({ entry, onClose }: WordDetailProps) => {
  const [activeTab, setActiveTab] = useState('meaning');
  const { language } = useLanguage();

  if (!entry) return null;

  const tabs = [
    { id: 'meaning', label: language === 'en' ? 'Meaning' : '意思' },
    { id: 'stroke', label: language === 'en' ? 'Stroke Order' : '笔顺' },
    { id: 'traditional', label: language === 'en' ? 'Traditional' : '繁体' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <header className="p-6 border-b border-border text-center">
          <h1 className="font-hanzi text-6xl font-bold text-primary">{entry.simplified}</h1>
          <p className="text-2xl text-muted-foreground mt-2">{entry.pinyin}</p>
        </header>
        
        <nav className="flex border-b border-border">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${(activeTab === tab.id) ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="p-6 min-h-[250px]">
          {activeTab === 'meaning' && (
            <ul className="list-decimal list-inside space-y-2 text-lg">
              {entry.meanings.map((meaning, index) => (
                <li key={index}>{meaning}</li>
              ))}
            </ul>
          )}
          {activeTab === 'stroke' && entry.simplified.length === 1 && (
             <HanziStroke character={entry.simplified} />
          )}
          {activeTab === 'stroke' && entry.simplified.length > 1 && (
             <p className="text-center text-muted-foreground pt-10">Stroke order is only available for single characters.</p>
          )}
          {activeTab === 'traditional' && (
            <p className="text-center font-hanzi text-5xl pt-10">{entry.traditional || 'N/A'}</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default WordDetail;
