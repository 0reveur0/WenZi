import { useState } from 'react';
import { X, BookOpen, PenLine } from 'lucide-react';
import type { DictionaryEntry } from '../types';
import { renderPinyinBadges } from '../utils/pinyin';
import { isSameCharForm } from '../utils/word';
import HanziStroke from './HanziStroke';

interface WordDetailProps {
  word: DictionaryEntry;
  onClose: () => void;
}

type Tab = 'info' | 'stroke';

export default function WordDetail({ word, onClose }: WordDetailProps) {
  const [tab, setTab] = useState<Tab>('info');
  const sameForm = isSameCharForm(word);
  const chars = Array.from(word.simplified);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Chi tiết từ</p>
            <div className="mt-3 flex items-baseline gap-4 flex-wrap">
              <h2 className="text-5xl font-semibold text-white leading-tight">{word.simplified}</h2>
              {!sameForm && (
                <span className="text-2xl text-slate-400" title="Phồn thể">{word.traditional}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {renderPinyinBadges(word.pinyinNumbered)}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">{word.pinyin}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 text-slate-300 transition hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 border-b border-slate-800 px-6">
          <TabButton active={tab === 'info'} onClick={() => setTab('info')} icon="info">
            Thông tin
          </TabButton>
          <TabButton active={tab === 'stroke'} onClick={() => setTab('stroke')} icon="stroke">
            Nét bút
          </TabButton>
        </div>

        {/* Tab content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'info' ? (
            <InfoTab word={word} />
          ) : (
            <StrokeTab chars={chars} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
        active
          ? 'border-cyan-400 text-cyan-300'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon === 'info' ? (
        <BookOpen className="h-4 w-4" />
      ) : (
        <PenLine className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}

function InfoTab({ word }: { word: DictionaryEntry }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Meanings */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Nghĩa</p>
        <ol className="mt-3 space-y-2">
          {word.meanings.map((meaning, i) => (
            <li key={i} className="flex gap-3 text-sm leading-6 text-slate-200">
              <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
                {i + 1}
              </span>
              <span>{meaning}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Classifiers */}
      {word.classifiers && word.classifiers.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Lượng từ (Measure words)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {word.classifiers.map((cl) => (
              <span
                key={cl}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-base font-medium text-slate-200"
              >
                {cl}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Character forms */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Giản thể</p>
          <p className="mt-2 text-3xl font-semibold text-white">{word.simplified}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Phồn thể</p>
          <p className="mt-2 text-3xl font-semibold text-slate-300">{word.traditional}</p>
        </div>
      </div>
    </div>
  );
}

function StrokeTab({ chars }: { chars: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const char = chars[activeIdx] ?? chars[0];

  return (
    <div className="flex flex-col gap-4">
      {chars.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {chars.map((ch, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`h-11 w-11 rounded-xl border text-lg font-semibold transition ${
                i === activeIdx
                  ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
      <HanziStroke key={char} character={char} />
    </div>
  );
}
