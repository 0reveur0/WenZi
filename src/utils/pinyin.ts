export const toneColors = {
  '1': 'text-cyan-300',
  '2': 'text-emerald-300',
  '3': 'text-amber-300',
  '4': 'text-rose-300',
  '5': 'text-slate-300'
};

export function formatNumberedPinyin(value: string) {
  return value
    .split(' ')
    .map((token) => {
      const tone = token.slice(-1);
      const base = token.slice(0, -1);
      return {
        tone: tone.match(/[1-5]/) ? tone : '5',
        word: tone.match(/[1-5]/) ? base : token
      };
    })
    .map(({ tone, word }) => ({ word, tone }));
}

export function renderPinyinColored(value: string) {
  return formatNumberedPinyin(value).map(({ word, tone }, index) => (
    <span key={`${word}-${index}`} className={`${toneColors[tone] ?? 'text-slate-300'} mr-1`}> 
      {word}
    </span>
  ));
}
