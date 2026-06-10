import type { DictionaryEntry } from '../types';

export function getPrimaryMeaning(word: DictionaryEntry): string {
  return word.meanings[0] ?? '';
}

export function getShortDescription(word: DictionaryEntry): string {
  const primary = getPrimaryMeaning(word);
  return primary.length > 80 ? `${primary.slice(0, 77)}…` : primary;
}

export function isSameCharForm(word: DictionaryEntry): boolean {
  return word.simplified === word.traditional;
}
