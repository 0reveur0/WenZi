import React from 'react';

interface WordCardProps {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

const WordCard: React.FC<WordCardProps> = ({ id, hanzi, pinyin, meaning }) => {
  return (
    <a href={`/dictionary/word-${id}`}>
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
        <h3 className="text-2xl font-bold text-white font-hanzi">{hanzi}</h3>
        <p className="text-gray-400 text-lg">{pinyin}</p>
        <p className="text-gray-200 mt-2">{meaning}</p>
      </div>
    </a>
  );
};

export default WordCard;
