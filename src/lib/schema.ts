/**
 * Định nghĩa kiểu dữ liệu cho bảng dictionary.
 * Schema thực tế được tạo trong src/lib/db.ts.
 */

export interface DictionaryEntry {
  id?: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  vietnamese: string;
}
