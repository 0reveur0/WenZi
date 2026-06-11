import { DictionaryEntry } from '../hooks/useDictionary';

interface ResultsListProps {
  results: DictionaryEntry[];
  onSelect: (entry: DictionaryEntry) => void;
}

const ResultsList = ({ results, onSelect }: ResultsListProps) => {
  if (!results.length) {
    return null;
  }

  return (
    <ul>
      {results.map((entry) => (
        <li key={entry.id} onClick={() => onSelect(entry)}>
          <div>{entry.simplified}</div>
          <div>{entry.pinyin}</div>
          <div>{entry.meanings.join(', ')}</div>
        </li>
      ))}
    </ul>
  );
};

export default ResultsList;
