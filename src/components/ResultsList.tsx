import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import WordCard from './WordCard';
import type { DictionaryEntry } from '../types';

interface ResultsListProps {
  results: DictionaryEntry[];
  onSelect: (word: DictionaryEntry) => void;
}

export default function ResultsList({ results, onSelect }: ResultsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700"
    >
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {items.map((virtualItem) => {
          const word = results[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '1rem',
              }}
            >
              <WordCard word={word} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
