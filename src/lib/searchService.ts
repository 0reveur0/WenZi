/**
 * WenZi Client-Side Search Service
 * ─────────────────────────────────
 * Lazy-load dictionary chunks và tìm kiếm client-side.
 *
 * Chiến lược:
 *   1. Load index.json để biết các chunk có sẵn
 *   2. Dựa vào query, dự đoán chunk cần load
 *   3. Cache các chunk đã load
 *   4. Tìm kiếm trong các chunk đã load
 */

export interface DictEntry {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  hanviet: string;
  vietnamese: string;
}

interface ChunkInfo {
  file: string;
  count: number;
}

interface IndexData {
  chunks: Record<string, ChunkInfo>;
  total: number;
  generatedAt: string;
}

type SearchResult = DictEntry & { _score: number };

// ── Config ──────────────────────────────────────────────────────────────
const CHUNKS_BASE_URL = '/data/chunks';
const INDEX_URL = `${CHUNKS_BASE_URL}/index.json`;
const MAX_RESULTS = 50;

// ── State ───────────────────────────────────────────────────────────────
let indexData: IndexData | null = null;
const chunkCache: Map<string, DictEntry[]> = new Map();
const allEntriesCache: DictEntry[] | null = null;
let nextId = 0;

// ── Helpers ─────────────────────────────────────────────────────────────
function removeTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ǖǘǚǜ]/g, 'u')
    .toLowerCase()
    .trim();
}

function assignIds(entries: DictEntry[]): DictEntry[] {
  return entries.map(e => ({ ...e, id: nextId++ }));
}

// ── Loading ─────────────────────────────────────────────────────────────
async function loadIndex(): Promise<IndexData> {
  if (indexData) return indexData;

  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`Failed to load index: ${res.status}`);
  indexData = await res.json();
  return indexData!;
}

async function loadChunk(letter: string): Promise<DictEntry[]> {
  const key = letter.toLowerCase();
  if (chunkCache.has(key)) return chunkCache.get(key)!;

  const index = await loadIndex();
  const chunkInfo = index.chunks[key];
  if (!chunkInfo) return [];

  const res = await fetch(`${CHUNKS_BASE_URL}/${chunkInfo.file}`);
  if (!res.ok) throw new Error(`Failed to load chunk ${key}: ${res.status}`);

  const entries: DictEntry[] = await res.json();
  const withIds = assignIds(entries);
  chunkCache.set(key, withIds);
  return withIds;
}

async function loadAllChunks(): Promise<DictEntry[]> {
  const index = await loadIndex();
  const letters = Object.keys(index.chunks);
  const promises = letters.map(l => loadChunk(l));
  const results = await Promise.all(promises);
  return results.flat();
}

// ── Query Analysis ───────────────────────────────────────────────────────
function getPinyinLetter(query: string): string | null {
  const plain = removeTones(query);
  const first = plain.charAt(0).toLowerCase();
  if (first >= 'a' && first <= 'z') return first;
  return null;
}

function isLikelyPinyin(query: string): boolean {
  // Chỉ chứa chữ cái Latin
  return /^[a-zA-Z\s]+$/.test(removeTones(query));
}

function isHanZi(query: string): boolean {
  // Chứa ký tự Trung Quốc
  return /[\u4e00-\u9fff]/.test(query);
}

// ── Search Logic ──────────────────────────────────────────────────────────
function scoreEntry(entry: DictEntry, query: string, queryPlain: string): number {
  const simpPlain = removeTones(entry.simplified);
  const tradPlain = removeTones(entry.traditional);
  const pinyinPlain = removeTones(entry.pinyin);
  const hanvietPlain = removeTones(entry.hanviet);
  const vietPlain = removeTones(entry.vietnamese);

  // Exact matches (highest priority)
  if (entry.simplified === query) return 0;
  if (entry.traditional === query) return 1;
  if (pinyinPlain === queryPlain) return 2;
  if (entry.hanviet === query) return 3;
  if (hanvietPlain === queryPlain) return 3;
  if (entry.vietnamese === query) return 4;
  if (vietPlain === queryPlain) return 4;

  // Prefix matches
  if (entry.simplified.startsWith(query)) return 10;
  if (entry.traditional?.startsWith(query)) return 11;
  if (pinyinPlain.startsWith(queryPlain)) return 12;
  if (hanvietPlain.startsWith(queryPlain)) return 13;
  if (vietPlain.startsWith(queryPlain)) return 14;

  // Contains matches
  if (entry.simplified.includes(query)) return 20;
  if (entry.traditional?.includes(query)) return 21;
  if (pinyinPlain.includes(queryPlain)) return 22;
  if (hanvietPlain.includes(queryPlain)) return 23;
  if (vietPlain.includes(queryPlain)) return 24;

  return 100; // No match
}

function searchInEntries(entries: DictEntry[], query: string): SearchResult[] {
  const queryPlain = removeTones(query);
  const results: SearchResult[] = [];

  for (const entry of entries) {
    const score = scoreEntry(entry, query, queryPlain);
    if (score < 100) {
      results.push({ ...entry, _score: score });
    }
  }

  // Sort by score, then by length of simplified
  results.sort((a, b) => {
    if (a._score !== b._score) return a._score - b._score;
    return a.simplified.length - b.simplified.length;
  });

  return results.slice(0, MAX_RESULTS);
}

// ── Public API ───────────────────────────────────────────────────────────
export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const q = query.trim();

  // Chiến lược load:
  // 1. Nếu query là chữ Hán → load tất cả chunks (không biết pinyin)
  // 2. Nếu query là Latin → chỉ load chunk phù hợp với chữ cái đầu
  // 3. Nếu không rõ → load tất cả để đảm bảo

  let entries: DictEntry[];

  if (isHanZi(q)) {
    // Chữ Hán → cần load tất cả
    entries = await loadAllChunks();
  } else if (isLikelyPinyin(q)) {
    const letter = getPinyinLetter(q);
    if (letter) {
      // Load chunk phù hợp + các chunk lân cận
      entries = await loadChunk(letter);
      // Có thể thêm các chunk khác nếu cần
    } else {
      entries = await loadAllChunks();
    }
  } else {
    // Có thể là Hán Việt hoặc tiếng Việt → load tất cả
    entries = await loadAllChunks();
  }

  return searchInEntries(entries, q);
}

export async function getEntryById(id: number): Promise<DictEntry | null> {
  // Tìm trong cache
  for (const entries of chunkCache.values()) {
    const found = entries.find(e => e.id === id);
    if (found) return found;
  }
  return null;
}

export async function preloadCommonChunks(): Promise<void> {
  // Preload các chunk phổ biến (hsk level 1-2 thường gặp)
  const commonLetters = ['a', 'b', 'c', 'd', 'h', 'j', 'm', 'n', 's', 't', 'x', 'y', 'z'];
  await Promise.all(commonLetters.map(l => loadChunk(l)));
}

export function getCacheStats(): { chunksLoaded: number; totalEntries: number } {
  let totalEntries = 0;
  for (const entries of chunkCache.values()) {
    totalEntries += entries.length;
  }
  return {
    chunksLoaded: chunkCache.size,
    totalEntries
  };
}

export function clearCache(): void {
  chunkCache.clear();
}
