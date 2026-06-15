/**
 * Kết nối SQLite sử dụng bun:sqlite (built-in Bun runtime).
 * Module này cung cấp một instance Database dùng chung cho toàn bộ ứng dụng.
 *
 * Lưu ý: chỉ hoạt động trong môi trường Bun (server-side).
 * Khi chạy Astro ở chế độ SSR với Bun runtime, import module này từ các
 * endpoint hoặc page server-side (không phải static pages).
 */

import { Database } from 'bun:sqlite';
import { join } from 'node:path';

const DB_PATH = join(process.cwd(), 'src', 'data', 'wenzi.db');

let _db: Database | null = null;

/**
 * Trả về instance Database dùng chung (singleton).
 * Tạo file DB nếu chưa tồn tại.
 */
export function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH, { create: true });
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA foreign_keys = ON;');
  }
  return _db;
}

/**
 * Đóng kết nối database (dùng khi shutdown).
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
