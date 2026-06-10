import type { DictionaryEntry } from '../types';
import { renderPinyinColored } from '../utils/pinyin';
import { getShortDescription, isSameCharForm } from '../utils/word';

interface WordCardProps {
  word: DictionaryEntry;
  onSelect: (word: DictionaryEntry) => void;
}

export default function WordCard({ word, onSelect }: WordCardProps) {
  const sameForm = isSameCharForm(word);

  return (
    <button
      type="button"
      onClick={() => onSelect(word)}
      className="group w-full rounded-3xl border border-slate-800 bg-slate-900/95 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-semibold text-white">{word.simplified}</span>
            {!sameForm && (
              <span className="text-base text-slate-400">{word.traditional}</span>
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap gap-0.5 text-sm">
            {renderPinyinColored(word.pinyinNumbered)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
          {word.meanings.length > 1 ? `${word.meanings.length} nghĩa` : 'Từ vựng'}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400 line-clamp-2">
        {getShortDescription(word)}
      </p>
    </button>
  );
}
