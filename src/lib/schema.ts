/**
 * Schema định nghĩa cấu trúc bảng dữ liệu từ điển WenZi.
 * Chạy hàm initSchema() một lần để tạo bảng nếu chưa có.
 */

import { getDb } from './db';

export function initSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      simplified  TEXT NOT NULL,        -- Chữ giản thể (简体)
      traditional TEXT,                 -- Chữ phồn thể (繁體)
      pinyin      TEXT NOT NULL,        -- Phiên âm Hán ngữ
      han_viet    TEXT NOT NULL,        -- Âm Hán Việt
      meaning_vi  TEXT NOT NULL,        -- Nghĩa tiếng Việt
      meaning_en  TEXT,                 -- Nghĩa tiếng Anh (tuỳ chọn)
      tone        INTEGER,              -- Thanh điệu (1–4)
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_simplified
      ON entries (simplified);

    CREATE INDEX IF NOT EXISTS idx_entries_han_viet
      ON entries (han_viet);

    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts
      USING fts5(
        simplified,
        traditional,
        pinyin,
        han_viet,
        meaning_vi,
        content='entries',
        content_rowid='id'
      );
  `);
}
