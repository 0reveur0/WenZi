interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 gap-8">
      <div className="text-center">
        <p className="text-3xl font-semibold text-white tracking-tight">Centi</p>
        <p className="mt-2 text-sm text-slate-400">Đang tải từ điển…</p>
      </div>

      <div className="w-64">
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">{progress}%</p>
      </div>
    </div>
  );
}
