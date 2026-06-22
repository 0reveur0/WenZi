import React, { useState } from 'react';
import type { શબ્દ, वाक्य, সমার্থক, ವಿರುದ್ಧार्थी, collocation, সম্পর্কিতશબ્દ } from '../../lib/schema';
import CharBreakdown from './CharBreakdown';

interface Example {
    id: number;
    word_id: number;
    sentence: string;
    translation_vi: string;
    translation_en: string;
}

interface WordData {
    id: number;
    simplified: string;
    traditional: string;
    pinyin: string;
    hanviet: string;
    partOfSpeech: string;
    hsk: number;
    tocfl: number;
    frequency: number;
    meaning_vi: string;
    meaning_en: string;
    examples: Example[];
    synonyms: any[];
    antonyms: any[];
    collocations: any[];
    related_words: any[];
}


interface WordPageProps {
  wordData: WordData;
}

type Language = 'vi' | 'en';

const WordPage: React.FC<WordPageProps> = ({ wordData }) => {
  const [language, setLanguage] = useState<Language>('vi');

  const { 
    simplified, 
    traditional, 
    pinyin,
    hanviet,
    partOfSpeech,
    hsk,
    tocfl,
    frequency,
    meaning_vi,
    meaning_en,
    examples
  } = wordData;

  const meaning = language === 'vi' ? meaning_vi : meaning_en;
  const getTranslation = (example: Example) => language === 'vi' ? example.translation_vi : example.translation_en;


  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left Sidebar */}
      <div className="col-span-3">
        <div className="p-4 border rounded">
            <h2 className="font-bold">Metadata</h2>
            <p>Part of Speech: {partOfSpeech}</p>
            <p>HSK Level: {hsk}</p>
            <p>TOCFL Level: {tocfl}</p>
            <p>Frequency: {frequency}</p>
            {/* Add other metadata here */}
        </div>
        <div className="p-4 border rounded mt-4">
            <h2 className="font-bold">Language</h2>
            <div className="flex space-x-2 mt-2">
                <button onClick={() => setLanguage('vi')} className={`px-3 py-1 rounded ${language === 'vi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Tiếng Việt</button>
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>English</button>
            </div>
        </div>
      </div>

      {/* Center Content */}
      <div className="col-span-6">
        <div className="p-4 border rounded">
            <h1 className="text-4xl font-bold">{simplified} {traditional && `| ${traditional}`}</h1>
            <p className="text-xl">{pinyin}</p>
            <p className="text-lg font-semibold">{hanviet}</p>
            <p className="mt-4 text-2xl">{meaning}</p>
            {/* Add audio, save, share buttons here */}
        </div>
        <div className="mt-4 p-4 border rounded">
            <h2 className="font-bold">Ví dụ</h2>
            {examples.map(ex => (
                <div key={ex.id} className="mt-2">
                    <p className="text-lg">{ex.sentence}</p>
                    <p className="text-gray-500">{getTranslation(ex)}</p>
                </div>
            ))}
        </div>
        {/* Add other sections here */}
      </div>

      {/* Right Sidebar */}
      <div className="col-span-3">
        <CharBreakdown word={simplified} />
      </div>
    </div>
  );
};

export default WordPage;
