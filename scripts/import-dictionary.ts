#!/usr/bin/env bun
/**
 * WenZi — Import Script
 * ─────────────────────
 * Đọc dữ liệu từ data/imports/ và nhập vào SQLite.
 *
 * Định dạng được hỗ trợ:
 *   .json     — mảng [{simplified, traditional?, pinyin?, vietnamese, hsk_level?}]
 *   .csv      — header row: simplified,traditional,pinyin,vietnamese,hsk_level
 *   .u8      — CC-CEDICT format (traditional simplified [pinyin] /def1/def2/)
 *
 * Dùng:
 *   bun run import-dictionary
 *   bun run import-dictionary --file data/imports/myfile.json
 *   bun run import-dictionary --dry-run
 *   bun run import-dictionary --clear     (xóa toàn bộ trước khi nhập)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import initSqlJs from 'sql.js';
import { DB_PATH, removeTones, saveDb } from '../src/lib/db.ts';

// ── Types ─────────────────────────────────────────────────────────────────
interface RawRecord {
  simplified: string;
  traditional?: string | null;
  pinyin?: string | null;
  vietnamese: string;
  hsk_level?: number | null;
}

interface Stats {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
}

// ── CLI args ──────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const dryRun   = args.includes('--dry-run');
const clearAll = args.includes('--clear');
const fileIdx  = args.indexOf('--file');
const singleFile = fileIdx >= 0 ? args[fileIdx + 1] : null;

const IMPORT_DIR = join(process.cwd(), 'data', 'imports');

// ── Terminal colors ───────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

function log(msg: string) { process.stdout.write(msg + '\n'); }
function ok(msg: string)  { log(`${C.green}✓${C.reset} ${msg}`); }
function warn(msg: string){ log(`${C.yellow}⚠${C.reset} ${msg}`); }
function err(msg: string) { log(`${C.red}✗${C.reset} ${msg}`); }
function info(msg: string){ log(`${C.cyan}ℹ${C.reset} ${msg}`); }

// ── Parsers ───────────────────────────────────────────────────────────────

/** JSON: [{simplified, traditional?, pinyin?, vietnamese, hsk_level?}, ...] */
function parseJSON(content: string): RawRecord[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error('JSON phải là mảng');
  return data as RawRecord[];
}

/** CSV với header: simplified,traditional,pinyin,vietnamese,hsk_level */
function parseCSV(content: string): RawRecord[] {
  const lines   = content.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idx = (col: string) => header.indexOf(col);

  const simp = idx('simplified');
  const trad = idx('traditional');
  const pin  = idx('pinyin');
  const viet = idx('vietnamese');
  const hsk  = idx('hsk_level');

  if (simp < 0 || viet < 0) {
    throw new Error('CSV phải có cột "simplified" và "vietnamese"');
  }

  const records: RawRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const simplified = cols[simp]?.trim();
    const vietnamese = cols[viet]?.trim();
    if (!simplified || !vietnamese) continue;

    records.push({
      simplified,
      traditional:  trad >= 0 ? cols[trad]?.trim() || null : null,
      pinyin:       pin  >= 0 ? cols[pin]?.trim()  || null : null,
      vietnamese,
      hsk_level:    hsk  >= 0 ? parseInt(cols[hsk]) || null : null,
    });
  }
  return records;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

/**
 * CC-CEDICT format:
 *   Traditional Simplified [pinyin] /def1/def2/.../
 * Dùng /def1/ làm "vietnamese" (nếu có label "Vietnamese:" thì lấy sau đó,
 * ngược lại lấy /def1/ gốc cho bước tiếp theo người dùng chỉnh tay).
 */
function parseCEDICT(content: string): RawRecord[] {
  const records: RawRecord[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Format: Traditional Simplified [pinyin] /def1/.../
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
    if (!m) continue;

    const [, traditional, simplified, pinyinRaw, defs] = m;
    const defList = defs.split('/').map(d => d.trim()).filter(Boolean);

    // Tìm nghĩa tiếng Việt nếu có label "Vietnamese: ..."
    const viDef = defList.find(d => d.toLowerCase().startsWith('vietnamese:'));
    const vietnamese = viDef
      ? viDef.replace(/^Vietnamese:\s*/i, '').trim()
      : defList[0];

    if (!simplified || !vietnamese) continue;

    records.push({
      simplified,
      traditional: traditional !== simplified ? traditional : null,
      pinyin: pinyinRaw.trim(),
      vietnamese,
    });
  }
  return records;
}

// ── Data quality ──────────────────────────────────────────────────────────
function cleanRecord(r: RawRecord): RawRecord | null {
  const simplified = r.simplified?.trim();
  const vietnamese = r.vietnamese?.trim();

  // Bắt buộc phải có giản thể và nghĩa tiếng Việt
  if (!simplified || !vietnamese) return null;

  return {
    simplified,
    traditional:  r.traditional?.trim()  || null,
    pinyin:       r.pinyin?.trim()        || null,
    vietnamese,
    hsk_level:    r.hsk_level ?? null,
  };
}

// ── Main import ───────────────────────────────────────────────────────────
async function main() {
  log(`\n${C.bold}WenZi — Import từ điển${C.reset}\n`);

  if (dryRun)   warn('Chế độ DRY-RUN: không ghi vào database.');
  if (clearAll) warn('Tùy chọn --clear: sẽ xóa toàn bộ dữ liệu hiện có.');

  // Tìm file cần import
  const files: string[] = [];
  if (singleFile) {
    if (!existsSync(singleFile)) {
      err(`Không tìm thấy file: ${singleFile}`); process.exit(1);
    }
    files.push(singleFile);
  } else {
    if (!existsSync(IMPORT_DIR)) {
      err(`Thư mục data/imports/ không tồn tại.`); process.exit(1);
    }
    const all = readdirSync(IMPORT_DIR);
    const supported = all.filter(f => ['.json', '.csv', '.u8', '.txt'].includes(extname(f).toLowerCase()));
    files.push(...supported.map(f => join(IMPORT_DIR, f)));
  }

  if (!files.length) {
    warn('Không tìm thấy file nào để import. Đặt file .json / .csv / .u8 vào data/imports/');
    process.exit(0);
  }

  info(`Tìm thấy ${files.length} file: ${files.map(f => basename(f)).join(', ')}`);

  // Đọc và parse tất cả records
  const allRecords: RawRecord[] = [];
  for (const filePath of files) {
    const name    = basename(filePath);
    const ext     = extname(filePath).toLowerCase();
    const content = readFileSync(filePath, 'utf-8');

    try {
      let parsed: RawRecord[];
      if      (ext === '.json') parsed = parseJSON(content);
      else if (ext === '.csv')  parsed = parseCSV(content);
      else                      parsed = parseCEDICT(content);

      info(`  ${name}: ${parsed.length} bản ghi thô`);
      allRecords.push(...parsed);
    } catch (e) {
      err(`  Lỗi parse ${name}: ${(e as Error).message}`);
    }
  }

  if (!allRecords.length) {
    warn('Không có bản ghi nào sau khi parse.'); process.exit(0);
  }

  // Làm sạch
  const cleaned = allRecords.map(cleanRecord).filter((r): r is RawRecord => r !== null);
  const removed = allRecords.length - cleaned.length;
  if (removed > 0) warn(`  Loại bỏ ${removed} bản ghi thiếu dữ liệu.`);

  log(`\n${C.bold}Tổng:${C.reset} ${cleaned.length} bản ghi hợp lệ từ ${allRecords.length} thô.\n`);

  if (dryRun) {
    ok('Dry-run hoàn thành. Không có thay đổi nào được ghi.');
    return;
  }

  // Khởi tạo DB
  const SQL = await initSqlJs();
  const db  = existsSync(DB_PATH)
    ? new SQL.Database(readFileSync(DB_PATH))
    : new SQL.Database();

  // Schema + migration
  db.run(`
    CREATE TABLE IF NOT EXISTS dictionary (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      simplified   TEXT    NOT NULL,
      traditional  TEXT,
      pinyin       TEXT,
      pinyin_plain TEXT,
      vietnamese   TEXT    NOT NULL,
      hsk_level    INTEGER,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cols = new Set<string>(
    (db.exec('PRAGMA table_info(dictionary)')[0]?.values ?? []).map(r => r[1] as string)
  );
  if (!cols.has('pinyin_plain')) db.run('ALTER TABLE dictionary ADD COLUMN pinyin_plain TEXT');
  if (!cols.has('hsk_level'))    db.run('ALTER TABLE dictionary ADD COLUMN hsk_level INTEGER');
  if (!cols.has('created_at'))   db.run('ALTER TABLE dictionary ADD COLUMN created_at DATETIME DEFAULT NULL');

  // Indexes
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_dict_simplified   ON dictionary(simplified);
    CREATE INDEX IF NOT EXISTS idx_dict_traditional  ON dictionary(traditional);
    CREATE INDEX IF NOT EXISTS idx_dict_pinyin_plain ON dictionary(pinyin_plain);
    CREATE INDEX IF NOT EXISTS idx_dict_vietnamese   ON dictionary(vietnamese);
    CREATE INDEX IF NOT EXISTS idx_dict_hsk          ON dictionary(hsk_level);
  `);

  // Xóa tất cả nếu --clear
  if (clearAll) {
    db.run('DELETE FROM dictionary');
    ok('Đã xóa toàn bộ dữ liệu cũ.');
  }

  // Build dedup set từ dữ liệu hiện có
  const existingSet = new Set<string>();
  const existRes = db.exec('SELECT simplified, vietnamese FROM dictionary');
  for (const row of existRes[0]?.values ?? []) {
    existingSet.add(`${row[0]}|${row[1]}`);
  }

  // Batch insert với transaction
  const stats: Stats = { total: cleaned.length, inserted: 0, skipped: 0, errors: 0 };

  db.run('BEGIN');
  const stmt = db.prepare(`
    INSERT INTO dictionary (simplified, traditional, pinyin, pinyin_plain, vietnamese, hsk_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const BAR_WIDTH = 30;
  let lastPct = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const r   = cleaned[i];
    const key = `${r.simplified}|${r.vietnamese}`;

    // Hiển thị tiến trình
    const pct = Math.floor((i / cleaned.length) * 100);
    if (pct !== lastPct) {
      lastPct = pct;
      const filled = Math.floor((pct / 100) * BAR_WIDTH);
      const bar    = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
      process.stdout.write(`\r  [${bar}] ${pct}%  (${i}/${cleaned.length})`);
    }

    if (existingSet.has(key)) { stats.skipped++; continue; }

    try {
      stmt.run([
        r.simplified,
        r.traditional  || null,
        r.pinyin       || null,
        r.pinyin ? removeTones(r.pinyin) : null,
        r.vietnamese,
        r.hsk_level    ?? null,
      ]);
      existingSet.add(key);
      stats.inserted++;
    } catch (e) {
      stats.errors++;
      if (stats.errors <= 5) err(`\n  Lỗi insert: ${(e as Error).message}`);
    }
  }

  stmt.free();
  db.run('COMMIT');

  process.stdout.write('\r' + ' '.repeat(BAR_WIDTH + 20) + '\r');

  // Lưu file
  saveDb(db);

  // Tổng kết
  log('');
  log(`${'─'.repeat(40)}`);
  log(`${C.bold}Kết quả import:${C.reset}`);
  log(`  Tổng bản ghi     : ${C.bold}${stats.total}${C.reset}`);
  log(`  ${C.green}Đã import${C.reset}        : ${C.bold}${stats.inserted}${C.reset}`);
  log(`  ${C.yellow}Bỏ qua (trùng)${C.reset}   : ${stats.skipped}`);
  if (stats.errors) log(`  ${C.red}Lỗi${C.reset}              : ${stats.errors}`);
  log(`${'─'.repeat(40)}`);

  const total = (db.exec('SELECT COUNT(*) FROM dictionary')[0]?.values[0]?.[0] as number) ?? 0;
  ok(`Database hiện có ${C.bold}${total}${C.reset} từ.`);
  info('Restart dev server để áp dụng dữ liệu mới: bun run dev');
}

main().catch(e => {
  err(`Lỗi không xử lý được: ${e.message}`);
  process.exit(1);
});
