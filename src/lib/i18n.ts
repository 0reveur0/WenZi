export type Lang = 'vi' | 'en';
export const LANG_KEY = 'wz-lang';

export function getLang(): Lang {
  try { return (localStorage.getItem(LANG_KEY) as Lang) || 'vi'; }
  catch { return 'vi'; }
}

export function setLang(lang: Lang): void {
  try { localStorage.setItem(LANG_KEY, lang); }
  catch {}
  document.documentElement.setAttribute('data-lang', lang);
  window.dispatchEvent(new CustomEvent('wz:langchange', { detail: { lang } }));
}

export function getMeaning(
  entry: { meaning_en?: string; meaning_vi?: string; vietnamese?: string },
  lang?: Lang,
): string {
  const l = lang ?? getLang();
  if (l === 'en') {
    return entry.meaning_en || entry.vietnamese || '';
  }
  return entry.meaning_vi || entry.vietnamese || entry.meaning_en || '';
}

export const UI = {
  vi: {
    searchPlaceholder: 'Nhập chữ Hán, pinyin hoặc nghĩa...',
    searchAria: 'Tìm kiếm từ vựng',
    hotKeywords: 'Từ khóa hot',
    history: 'Lịch sử',
    clearAll: 'Xóa tất cả',
    meaningEnLabel: 'Tiếng Anh',
    meaningViLabel: 'Tiếng Việt',
    hanviet: 'Hán Việt',
    examples: 'Ví dụ câu',
    strokeOrder: 'Thứ tự nét',
    pronounce: 'Phát âm',
    pronouncing: 'Đang phát...',
    favorite: 'Yêu thích',
    favorited: 'Đã lưu',
    topicVocab: 'Từ vựng theo chủ đề',
    noViTranslation: 'Chưa có bản dịch tiếng Việt',
    back: 'Quay lại',
    pinyin: 'Pinyin',
    traditional: 'Phồn thể',
    simplified: 'Giản thể',
    favTitle: 'Từ yêu thích',
    noFav: 'Chưa có từ yêu thích',
    searchStart: 'Bắt đầu tìm kiếm',
    searchHint: 'Nhập từ khóa vào ô tìm kiếm để tra cứu từ điển.',
    wordCount: (n: number) => `~${n.toLocaleString()} từ`,
    resultsFor: (n: number, q: string) => `${n} kết quả cho "${q}"`,
    noResults: (q: string) => `Không tìm thấy kết quả cho <strong>"${q}"</strong>`,
  },
  en: {
    searchPlaceholder: 'Enter Hanzi, pinyin or meaning...',
    searchAria: 'Search vocabulary',
    hotKeywords: 'Hot keywords',
    history: 'History',
    clearAll: 'Clear all',
    meaningEnLabel: 'English',
    meaningViLabel: 'Vietnamese',
    hanviet: 'Hán Việt',
    examples: 'Example sentences',
    strokeOrder: 'Stroke order',
    pronounce: 'Pronounce',
    pronouncing: 'Playing...',
    favorite: 'Favorite',
    favorited: 'Saved',
    topicVocab: 'Topic vocabulary',
    noViTranslation: 'No Vietnamese translation',
    back: 'Back',
    pinyin: 'Pinyin',
    traditional: 'Traditional',
    simplified: 'Simplified',
    favTitle: 'Favorites',
    noFav: 'No favorites yet',
    searchStart: 'Start searching',
    searchHint: 'Enter keywords in the search box to look up the dictionary.',
    wordCount: (n: number) => `~${n.toLocaleString()} words`,
    resultsFor: (n: number, q: string) => `${n} results for "${q}"`,
    noResults: (q: string) => `No results found for <strong>"${q}"</strong>`,
  },
} as const;

export type UIStrings = typeof UI.vi;
