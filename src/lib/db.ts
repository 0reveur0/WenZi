/**
 * Kết nối SQLite sử dụng sql.js (WebAssembly SQLite).
 * Tương thích Node.js / Bun — không cần binary native.
 */

import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DB_PATH = join(process.cwd(), 'src', 'data', 'wenzi.db');

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  _db = existsSync(DB_PATH)
    ? new SQL.Database(readFileSync(DB_PATH))
    : new SQL.Database();

  initSchema(_db);
  if (seedIfEmpty(_db)) persistDb(_db);

  return _db;
}

function persistDb(db: Database): void {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS dictionary (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      simplified    TEXT NOT NULL,
      traditional   TEXT,
      pinyin        TEXT,
      pinyin_plain  TEXT,
      vietnamese    TEXT NOT NULL
    );
  `);
}

function removeTones(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const SAMPLE_DATA: readonly [string, string, string, string][] = [
  ['中国', '中國', 'zhōng guó',  'Trung Quốc'],
  ['学生', '學生', 'xué shēng',  'Học sinh'],
  ['老师', '老師', 'lǎo shī',    'Giáo viên'],
  ['学习', '學習', 'xué xí',     'Học tập'],
  ['谢谢', '謝謝', 'xiè xiè',    'Cảm ơn'],
  ['你好', '你好', 'nǐ hǎo',     'Xin chào'],
  ['再见', '再見', 'zài jiàn',   'Tạm biệt'],
  ['朋友', '朋友', 'péng yǒu',   'Bạn bè'],
  ['家庭', '家庭', 'jiā tíng',   'Gia đình'],
  ['爱情', '愛情', 'ài qíng',    'Tình yêu'],
  ['工作', '工作', 'gōng zuò',   'Công việc'],
  ['时间', '時間', 'shí jiān',   'Thời gian'],
  ['书',   '書',   'shū',         'Sách'],
  ['水',   '水',   'shuǐ',        'Nước'],
  ['火',   '火',   'huǒ',         'Lửa'],
  ['天空', '天空', 'tiān kōng',  'Bầu trời'],
  ['音乐', '音樂', 'yīn yuè',    'Âm nhạc'],
  ['电影', '電影', 'diàn yǐng',  'Điện ảnh'],
  ['汉语', '漢語', 'hàn yǔ',     'Tiếng Hán / Tiếng Trung'],
  ['越南', '越南', 'yuè nán',    'Việt Nam'],
];

function seedIfEmpty(db: Database): boolean {
  const count = (db.exec('SELECT COUNT(*) FROM dictionary')[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return false;
  for (const [s, t, p, v] of SAMPLE_DATA) {
    db.run(
      'INSERT INTO dictionary (simplified, traditional, pinyin, pinyin_plain, vietnamese) VALUES (?,?,?,?,?)',
      [s, t, p, removeTones(p), v]
    );
  }
  return true;
}

// ── Truy vấn ─────────────────────────────────────────────────────────────
export interface DictEntry {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  vietnamese: string;
}

export async function getEntryById(id: number): Promise<DictEntry | null> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT id, simplified, traditional, pinyin, vietnamese FROM dictionary WHERE id = $id'
  );
  stmt.bind({ $id: id });
  const ok    = stmt.step();
  const entry = ok ? (stmt.getAsObject() as DictEntry) : null;
  stmt.free();
  return entry;
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}
