import { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import WordDetail from './components/WordDetail';
import LoadingScreen from './components/LoadingScreen';
import { useSearch } from './hooks/useSearch';
import { useDictionary } from './hooks/useDictionary';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import type { DictionaryEntry } from './types';

function App() {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<DictionaryEntry | null>(null);
  const { words, loading, error, progress } = useDictionary();
  const debouncedQuery = useDebouncedValue(query, 250);
  const results = useSearch(words, debouncedQuery);

  if (loading) {
    return <LoadingScreen progress={progress} />;
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-center p-8 gap-4">
        <p className="text-2xl font-semibold text-white">Không tải được dữ liệu</p>
        <p className="text-sm text-rose-400 max-w-md font-mono">{error}</p>
        <p className="text-sm text-slate-400 max-w-md">
          Chạy <code className="text-cyan-300">python scripts/parse_ccdict.py cedict_ts.txt</code> để tạo file dữ liệu, hoặc kiểm tra thư mục <code className="text-cyan-300">public/data/</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),_radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.08),_transparent_30%),_linear-gradient(180deg,#020617_0%,#0f172a_100%)] py-10 px-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">

        {/* Header */}
        <header className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-10 shadow-card backdrop-blur-xl">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-cyan-300">
              <Sparkles className="h-4 w-4" /> Centi
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Từ điển Trung-Việt tĩnh.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Tìm kiếm nhanh Hanzi, Pinyin và nghĩa. {words.length > 0 && (
                <span className="text-cyan-300">{words.length.toLocaleString()} từ vựng.</span>
              )}
            </p>
          </div>
          <div className="mt-10">
            <SearchBar query={query} onQueryChange={setQuery} />
          </div>
        </header>

        {/* Results + Sidebar */}
        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Results panel */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Kết quả tìm kiếm</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Nhập từ cần tìm và chọn một mục để xem chi tiết.
                </p>
              </div>
              <div className="shrink-0 rounded-3xl bg-slate-900/80 px-4 py-2.5 text-sm text-slate-300">
                {debouncedQuery.trim()
                  ? `${results.length} kết quả`
                  : `${words.length.toLocaleString()} từ`}
              </div>
            </div>

            {debouncedQuery.trim() ? (
              results.length > 0 ? (
                <ResultsList results={results} onSelect={setSelectedWord} />
              ) : (
                <EmptyState message="Không tìm thấy kết quả. Thử Hanzi, Pinyin có số thanh (ni3), hoặc nghĩa tiếng Anh." />
              )
            ) : (
              <EmptyState message="Nhập Hanzi, Pinyin (ni3 hao3) hoặc nghĩa để bắt đầu tìm kiếm." />
            )}
          </div>

          {/* Sidebar */}
          <aside className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-card self-start">
            <div className="flex items-center gap-2 text-2xl font-semibold text-white">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              Hướng dẫn
            </div>
            <div className="mt-6 space-y-3">
              <TipCard label="Tìm bằng Hanzi" example="你好, 学习, 中国" />
              <TipCard label="Tìm bằng Pinyin có số" example="ni3 hao3, xue2 xi2" />
              <TipCard label="Tìm bằng Pinyin dấu" example="nǐ hǎo, xuéxí" />
              <TipCard label="Tìm bằng nghĩa" example="hello, study, friend" />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Màu tone</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="text-cyan-300">Tone 1 ā</span>
                <span className="text-emerald-300">Tone 2 á</span>
                <span className="text-amber-300">Tone 3 ǎ</span>
                <span className="text-rose-300">Tone 4 à</span>
                <span className="text-slate-300">Neutral</span>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {selectedWord && (
        <WordDetail word={selectedWord} onClose={() => setSelectedWord(null)} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center text-slate-400">
      {message}
    </div>
  );
}

function TipCard({ label, example }: { label: string; example: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 p-3.5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm text-slate-300">{example}</p>
    </div>
  );
}

export default App;
