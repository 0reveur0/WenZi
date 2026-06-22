/**
 * Tiện ích localStorage cho lịch sử tra cứu và danh sách yêu thích.
 * Chỉ chạy client-side (browser).
 */

export interface StoredEntry {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  hanviet: string | null;
  vietnamese: string;
  meaning_en: string;
  meaning_vi: string;
}

const HISTORY_KEY  = 'wz-history';
const FAVORITES_KEY = 'wz-favorites';
const MAX_HISTORY  = 20;

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
  catch { return []; }
}

function save(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch { /* quota exceeded hoặc private mode */ }
}

function slim(e: StoredEntry): StoredEntry {
  return {
    id: e.id,
    simplified: e.simplified,
    traditional: e.traditional ?? null,
    pinyin: e.pinyin ?? null,
    hanviet: e.hanviet ?? null,
    vietnamese: e.vietnamese,
    meaning_en: e.meaning_en || e.vietnamese || '',
    meaning_vi: e.meaning_vi || '',
  };
}

// ── Lịch sử ──────────────────────────────────────────────────────────────
export function getHistory(): StoredEntry[] { return load<StoredEntry>(HISTORY_KEY); }

export function addToHistory(entry: StoredEntry): void {
  const h = getHistory().filter(e => e.id !== entry.id);
  h.unshift(slim(entry));
  save(HISTORY_KEY, h.slice(0, MAX_HISTORY));
}

export function clearHistory(): void { localStorage.removeItem(HISTORY_KEY); }

// ── Yêu thích ────────────────────────────────────────────────────────────
export function getFavorites(): StoredEntry[] { return load<StoredEntry>(FAVORITES_KEY); }

export function isFavorite(id: number): boolean {
  return getFavorites().some(e => e.id === id);
}

/** Trả về true nếu vừa được thêm, false nếu vừa bị xóa. */
export function toggleFavorite(entry: StoredEntry): boolean {
  const favs = getFavorites();
  const idx  = favs.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    save(FAVORITES_KEY, favs);
    return false;
  }
  favs.unshift(slim(entry));
  save(FAVORITES_KEY, favs);
  return true;
}

export function clearFavorites(): void { localStorage.removeItem(FAVORITES_KEY); }
