import { DictionaryEntry } from "../hooks/useDictionary";

interface WordCardProps {
  entry: DictionaryEntry;
  onSelect: (entry: DictionaryEntry) => void;
}

const WordCard = ({ entry, onSelect }: WordCardProps) => {
  return (
    <div
      className="bg-card text-card-foreground p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(entry)}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-hanzi text-2xl font-bold">{entry.simplified}</h3>
        {entry.traditional && (
          <p className="text-muted-foreground">{entry.traditional}</p>
        )}
      </div>
      <p className="text-primary mt-1">{entry.pinyin}</p>
      <p className="text-muted-foreground mt-2 truncate">
        {entry.meanings.join('; ')}
      </p>
    </div>
  );
};

export default WordCard;
