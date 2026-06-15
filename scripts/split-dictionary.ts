#!/usr/bin/env bun
/**
 * WenZi Data Splitter
 * ──────────────────
 * Chia file từ điển lớn thành các file nhỏ để lazy load trên client.
 *
 * Chiến lược:
 *   - Chia theo chữ cái đầu của pinyin (a.json, b.json, ...)
 *   - Các từ không có pinyin hoặc bắt đầu bằng số gộp vào misc.json
 *
 * Dùng:
 *   bun run split-dictionary
 *   bun run split-dictionary --input data/cedict.json --output public/data/chunks
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

// ── CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const inputIdx  = args.indexOf('--input');
const outputIdx = args.indexOf('--output');
const statsOnly = args.includes('--stats');

const DEFAULT_INPUT  = join(process.cwd(), 'src', 'data', 'sample_dictionary.json');
const DEFAULT_OUTPUT  = join(process.cwd(), 'public', 'data', 'chunks');

const INPUT_FILE  = inputIdx >= 0  ? args[inputIdx + 1]  : DEFAULT_INPUT;
const OUTPUT_DIR  = outputIdx >= 0 ? args[outputIdx + 1] : DEFAULT_OUTPUT;

// ── Types ──────────────────────────────────────────────────────────────
interface DictEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  hanviet: string;
  vietnamese: string;
}

// ── Terminal colors ───────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

function log(msg: string) { process.stdout.write(msg + '\n'); }
function ok(msg: string)  { log(`${C.green}✓${C.reset} ${msg}`); }
function info(msg: string){ log(`${C.cyan}ℹ${C.reset} ${msg}`); }

// ── Helpers ────────────────────────────────────────────────────────────
function removeTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ǖǘǚǜ]/g, 'u')
    .toLowerCase()
    .trim();
}

function getFirstLetter(pinyin: string | null | undefined): string {
  if (!pinyin) return 'misc';
  const plain = removeTones(pinyin);
  const first  = plain.charAt(0).toLowerCase();
  if (first >= 'a' && first <= 'z') return first;
  return 'misc';
}

// ── Main ───────────────────────────────────────────────────────────────
function main() {
  log(`\n${C.bold}WenZi — Data Splitter${C.reset}\n`);

  if (!existsSync(INPUT_FILE)) {
    log(`Error: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  // Đọc dữ liệu
  const rawContent = readFileSync(INPUT_FILE, 'utf-8');
  const entries: DictEntry[] = JSON.parse(rawContent);

  if (!Array.isArray(entries)) {
    log('Error: Input file must be a JSON array');
    process.exit(1);
  }

  info(`Loaded ${entries.length} entries from ${basename(INPUT_FILE)}`);

  // Thống kê
  const letterBuckets: Map<string, DictEntry[]> = new Map();

  for (const entry of entries) {
    if (!entry.simplified || !entry.vietnamese) continue;

    const letter = getFirstLetter(entry.pinyin);
    if (!letterBuckets.has(letter)) {
      letterBuckets.set(letter, []);
    }
    letterBuckets.get(letter)!.push(entry);
  }

  // Sắp xếp các bucket theo key
  const sortedKeys = Array.from(letterBuckets.keys()).sort();

  if (statsOnly) {
    log('\nChunk statistics:');
    let total = 0;
    for (const key of sortedKeys) {
      const count = letterBuckets.get(key)!.length;
      total += count;
      log(`  ${key}.json: ${count} entries`);
    }
    log(`\nTotal: ${total} entries in ${sortedKeys.length} chunks`);
    return;
  }

  // Tạo thư mục output
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Clear old files
  const oldFiles = existsSync(OUTPUT_DIR) ? readdirSync(OUTPUT_DIR) : [];
  for (const f of oldFiles) {
    if (f.endsWith('.json') && f !== 'index.json') {
      // Keep existing files that aren't ours
    }
  }

  // Ghi các chunk file
  let totalEntries = 0;
  const indexData: Record<string, { file: string; count: number }> = {};

  for (const key of sortedKeys) {
    const entries = letterBuckets.get(key)!;
    const filename = `${key}.json`;
    const filepath = join(OUTPUT_DIR, filename);

    // Sắp xếp entries theo pinyin rồi theo simplified
    entries.sort((a, b) => {
      const pa = (a.pinyin || '').toLowerCase();
      const pb = (b.pinyin || '').toLowerCase();
      if (pa !== pb) return pa.localeCompare(pb);
      return a.simplified.localeCompare(b.simplified);
    });

    // Ghi file
    writeFileSync(filepath, JSON.stringify(entries, null, 2), 'utf-8');
    totalEntries += entries.length;

    indexData[key] = { file: filename, count: entries.length };
  }

  // Ghi index file
  const indexFile = join(OUTPUT_DIR, 'index.json');
  writeFileSync(indexFile, JSON.stringify({
    chunks: indexData,
    total: totalEntries,
    generatedAt: new Date().toISOString()
  }, null, 2), 'utf-8');

  ok(`Created ${sortedKeys.length} chunk files in ${OUTPUT_DIR}`);
  ok(`Total: ${totalEntries} entries`);
  ok(`Index: index.json`);

  // Thống kê kích thước file
  log('\nChunk sizes:');
  for (const key of sortedKeys) {
    const filepath = join(OUTPUT_DIR, `${key}.json`);
    const size = (readFileSync(filepath).length / 1024).toFixed(1);
    log(`  ${key}.json: ${size} KB (${letterBuckets.get(key)!.length} entries)`);
  }
}

main();
