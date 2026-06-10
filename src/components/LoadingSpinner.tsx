export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-cyan-400/30 border-t-cyan-300 animate-spin"></div>
    </div>
  );
}
