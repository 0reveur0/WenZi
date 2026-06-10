import { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Play } from 'lucide-react';

interface HanziStrokeProps {
  character: string;
}

export default function HanziStroke({ character }: HanziStrokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    writerRef.current = null;
    setStatus('loading');

    const load = async () => {
      try {
        const HanziWriter = (await import('hanzi-writer')).default;
        if (!active || !containerRef.current) return;

        // Clear previous SVG if any
        containerRef.current.innerHTML = '';

        const writer = HanziWriter.create(containerRef.current, character, {
          width: 240,
          height: 240,
          strokeColor: '#38bdf8',
          radicalColor: '#0ea5e9',
          outlineColor: '#1e293b',
          drawingColor: '#ffffff',
          showCharacter: false,
          padding: 14,
          delayBetweenStrokes: 280,
          strokeAnimationSpeed: 1,
          onLoadCharDataSuccess: () => {
            if (active) {
              writerRef.current = writer;
              setStatus('ready');
              writer.animateCharacter();
            }
          },
          onLoadCharDataError: () => {
            if (active) setStatus('error');
          },
        });
      } catch {
        if (active) setStatus('error');
      }
    };

    load();
    return () => { active = false; };
  }, [character]);

  const replay = useCallback(() => {
    writerRef.current?.animateCharacter();
  }, []);

  const showStatic = useCallback(() => {
    if (!writerRef.current) return;
    writerRef.current.cancelAnimation();
    writerRef.current.showCharacter();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Nét bút</p>
          <p className="mt-1.5 text-2xl font-semibold text-white">{character}</p>
        </div>
        {status === 'ready' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={showStatic}
              title="Hiện ký tự"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={replay}
              title="Phát lại"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div ref={containerRef} className="h-[240px] w-[240px]" />
      </div>

      {status === 'loading' && (
        <p className="mt-3 text-center text-sm text-slate-500">Đang tải animation nét bút…</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-center text-sm text-rose-400">
          Không tìm thấy dữ liệu nét bút cho ký tự "{character}"
        </p>
      )}
    </div>
  );
}
