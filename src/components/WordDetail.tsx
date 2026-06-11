import { DictionaryEntry } from '../hooks/useDictionary';
import HanziStroke from './HanziStroke';

interface WordDetailProps {
  entry: DictionaryEntry;
}

const WordDetail = ({ entry }: WordDetailProps) => {
  return (
    <div>
      <h2>{entry.simplified}</h2>
      <p>{entry.pinyin}</p>
      <p>{entry.meanings.join(', ')}</p>
      <div>
        <h3>Stroke Order</h3>
        <HanziStroke character={entry.simplified} />
      </div>
    </div>
  );
};

export default WordDetail;
