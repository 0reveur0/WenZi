import { DictionaryEntry } from '../App';

interface ResultsListProps {
  results: DictionaryEntry[];
  onSelect: (entry: DictionaryEntry) => void;
}

const ResultsList = ({ results, onSelect }: ResultsListProps) => {
  return (
    <ul>
      {results.map((entry, index) => (
        <li key={index} onClick={() => onSelect(entry)}>
          <div>{entry.simplified}</div>
          <div>{entry.pinyin}</div>
          <div>{entry.definition}</div>
        </li>
      ))}
    </ul>
  );
};

export default ResultsList;
