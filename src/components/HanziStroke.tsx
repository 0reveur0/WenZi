import { useEffect, useMemo, useRef, useState } from 'react';

interface HanziStrokeProps {
  character: string;
}

export default function HanziStroke({ character }: HanziStrokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const char = useMemo(() => (character.length > 1 ? character[0] : character), [character]);

  useEffect(() => {
    let writer: any;
    let active = true;

    const load = async () => {
      const HanziWriter = (await import('hanzi-writer')).default;
      if (!active || !containerRef.current) return;
      writer = HanziWriter.create(containerRef.current, char, {
        width: 260,
        height: 260,
        strokeColor: '#38bdf8',
        radicalColor: '#0ea5e9',
        outlineColor: '#0f172a',
        drawingColor: '#ffffff',
        showCharacter: false,
        padding: 12,
        delayBetweenStrokes: 250,
        strokeAnimationSpeed: 1
      });
      writer.animateCharacter();
      setLoaded(true);
    };

    load();

    return () => {
      active = false;
      if (writer && writer.hideOutline) {
        writer.hideOutline();
      }
    };
  }, [char]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Nét bút</p>
          <p className="mt-2 text-lg font-medium text-white">
            Hiển thị cho ký tự đơn: <span className="text-cyan-300">{char}</span>
          </p>
        </div>
        {character.length > 1 ? (
          <p className="text-sm text-slate-400">Đang dùng ký tự đầu tiên vì Hanzi Writer chỉ hỗ trợ ký tự đơn.</p>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-center">
        <div ref={containerRef} className="h-[280px] w-[280px]" />
      </div>
      {!loaded ? <p className="mt-4 text-center text-sm text-slate-500">Đang tải mô phỏng nét bút…</p> : null}
    </div>
  );
}
