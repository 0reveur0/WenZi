import React from 'react';

interface CharacterCardProps {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  components: string[];
  strokes: number;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ id, hanzi, pinyin, meaning, components, strokes }) => {
  return (
    <a href={`/dictionary/character-${id}`}>
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
        <h3 className="text-3xl font-bold text-white font-hanzi">{hanzi}</h3>
        <p className="text-gray-400 text-lg">{pinyin}</p>
        <p className="text-gray-200 mt-2">{meaning}</p>
        <div className="mt-4 text-sm text-gray-400">
          <span>Components: {components.join(', ')}</span>
          <span className="mx-2">|</span>
          <span>Strokes: {strokes}</span>
        </div>
      </div>
    </a>
  );
};

export default React.memo(CharacterCard);
