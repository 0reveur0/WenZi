import { createElement } from 'react';

export const toneColors: Record<string, string> = {
  '1': 'text-cyan-300',
  '2': 'text-emerald-300',
  '3': 'text-amber-300',
  '4': 'text-rose-300',
  '5': 'text-slate-300',
};

export const toneBgColors: Record<string, string> = {
  '1': 'bg-cyan-500/15 text-cyan-200',
  '2': 'bg-emerald-500/15 text-emerald-200',
  '3': 'bg-amber-500/15 text-amber-200',
  '4': 'bg-rose-500/15 text-rose-200',
  '5': 'bg-slate-500/15 text-slate-300',
};

export interface PinyinToken {
  word: string;
  tone: string;
}

export function parseNumberedPinyin(value: string): PinyinToken[] {
  return value.split(' ').map((token) => {
    const lastChar = token.slice(-1);
    if (lastChar.match(/[1-5]/)) {
      return { word: token.slice(0, -1), tone: lastChar };
    }
    return { word: token, tone: '5' };
  });
}

export function renderPinyinColored(value: string) {
  return parseNumberedPinyin(value).map(({ word, tone }, index) =>
    createElement(
      'span',
      { key: `${word}-${index}`, className: `${toneColors[tone] ?? 'text-slate-300'} mr-0.5` },
      word
    )
  );
}

export function renderPinyinBadges(value: string) {
  return parseNumberedPinyin(value).map(({ word, tone }, index) =>
    createElement(
      'span',
      {
        key: `${word}-${index}`,
        className: `inline-block rounded-md px-1.5 py-0.5 text-sm font-medium ${toneBgColors[tone] ?? toneBgColors['5']}`,
      },
      word
    )
  );
}
