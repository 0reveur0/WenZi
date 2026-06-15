/**
 * Kết nối SQLite sử dụng sql.js (WebAssembly SQLite).
 * Tương thích Node.js / Bun — không cần binary native.
 *
 * Schema:
 *   id, simplified, traditional, pinyin, pinyin_plain,
 *   vietnamese, hsk_level, created_at
 */

import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const DB_PATH = join(process.cwd(), 'src', 'data', 'wenzi.db');

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  _db = existsSync(DB_PATH)
    ? new SQL.Database(readFileSync(DB_PATH))
    : new SQL.Database();

  initSchema(_db);
  runMigrations(_db);
  createIndexes(_db);

  if (seedIfEmpty(_db)) saveDb(_db);

  return _db;
}

export function saveDb(db?: Database): void {
  const target = db ?? _db;
  if (!target) return;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  writeFileSync(DB_PATH, Buffer.from(target.export()));
}

// ── Schema ────────────────────────────────────────────────────────────────
function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS dictionary (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      simplified    TEXT    NOT NULL,
      traditional   TEXT,
      pinyin        TEXT,
      pinyin_plain  TEXT,
      vietnamese    TEXT    NOT NULL,
      hsk_level     INTEGER,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Tự động thêm cột mới vào bảng cũ mà không mất dữ liệu.
 * SQLite không hỗ trợ ADD COLUMN IF NOT EXISTS nên dùng PRAGMA.
 */
function runMigrations(db: Database): void {
  const res  = db.exec('PRAGMA table_info(dictionary)');
  const cols = new Set<string>(
    (res[0]?.values ?? []).map(row => row[1] as string)
  );

  const pending: string[] = [];
  if (!cols.has('pinyin_plain'))
    pending.push('ALTER TABLE dictionary ADD COLUMN pinyin_plain TEXT');
  if (!cols.has('hsk_level'))
    pending.push('ALTER TABLE dictionary ADD COLUMN hsk_level INTEGER');
  if (!cols.has('created_at'))
    pending.push('ALTER TABLE dictionary ADD COLUMN created_at DATETIME DEFAULT NULL');

  for (const sql of pending) db.run(sql);
}

/** Index giúp tìm kiếm chính xác nhanh; LIKE '%q%' vẫn O(n) nhưng exact match sử dụng B-tree. */
function createIndexes(db: Database): void {
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_dict_simplified   ON dictionary(simplified);
    CREATE INDEX IF NOT EXISTS idx_dict_traditional  ON dictionary(traditional);
    CREATE INDEX IF NOT EXISTS idx_dict_pinyin_plain ON dictionary(pinyin_plain);
    CREATE INDEX IF NOT EXISTS idx_dict_vietnamese   ON dictionary(vietnamese);
    CREATE INDEX IF NOT EXISTS idx_dict_hsk          ON dictionary(hsk_level);
  `);
}

// ── Helpers ───────────────────────────────────────────────────────────────
export function removeTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ǖǘǚǜ]/g, 'u')
    .toLowerCase()
    .trim();
}

// ── Seed data (chỉ chạy khi bảng trống) ──────────────────────────────────
const SAMPLE_DATA: readonly [string, string, string, string, number][] = [
  ['中国', '中國', 'zhōng guó',  'Trung Quốc',     3],
  ['学生', '學生', 'xué shēng',  'Học sinh',        1],
  ['老师', '老師', 'lǎo shī',    'Giáo viên',       1],
  ['学习', '學習', 'xué xí',     'Học tập',         1],
  ['谢谢', '謝謝', 'xiè xiè',    'Cảm ơn',          1],
  ['你好', '你好', 'nǐ hǎo',     'Xin chào',        1],
  ['再见', '再見', 'zài jiàn',   'Tạm biệt',        1],
  ['朋友', '朋友', 'péng yǒu',   'Bạn bè',          1],
  ['家庭', '家庭', 'jiā tíng',   'Gia đình',        2],
  ['爱情', '愛情', 'ài qíng',    'Tình yêu',        3],
  ['工作', '工作', 'gōng zuò',   'Công việc',       2],
  ['时间', '時間', 'shí jiān',   'Thời gian',       2],
  ['书',   '書',   'shū',         'Sách',            1],
  ['水',   '水',   'shuǐ',        'Nước',            1],
  ['火',   '火',   'huǒ',         'Lửa',             1],
  ['天空', '天空', 'tiān kōng',  'Bầu trời',        2],
  ['音乐', '音樂', 'yīn yuè',    'Âm nhạc',         2],
  ['电影', '電影', 'diàn yǐng',  'Điện ảnh',        2],
  ['汉语', '漢語', 'hàn yǔ',     'Tiếng Hán / Tiếng Trung', 2],
  ['越南', '越南', 'yuè nán',    'Việt Nam',        3],
];

function seedIfEmpty(db: Database): boolean {
  const count = (db.exec('SELECT COUNT(*) FROM dictionary')[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return false;

  db.run('BEGIN');
  const stmt = db.prepare(
    'INSERT INTO dictionary (simplified, traditional, pinyin, pinyin_plain, vietnamese, hsk_level) VALUES (?,?,?,?,?,?)'
  );
  for (const [s, t, p, v, h] of SAMPLE_DATA) {
    stmt.run([s, t, p, removeTones(p), v, h]);
  }
  stmt.free();
  db.run('COMMIT');
  return true;
}

// ── Truy vấn ─────────────────────────────────────────────────────────────
export interface DictEntry {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  vietnamese: string;
  hsk_level: number | null;
}

export async function getEntryById(id: number): Promise<DictEntry | null> {
  const db   = await getDb();
  const stmt = db.prepare(
    'SELECT id, simplified, traditional, pinyin, vietnamese, hsk_level FROM dictionary WHERE id = $id'
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
