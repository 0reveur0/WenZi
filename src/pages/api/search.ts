import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db';

export const prerender = false;

interface DictionaryEntry {
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  vietnamese: string;
}

/** Loại bỏ dấu thanh để so khớp pinyin không dấu: "xue" → "xue". */
function removeTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (q.length === 0) return json([]);

  try {
    const db = await getDb();
    const like      = `%${q}%`;
    const likePlain = `%${removeTones(q)}%`;

    const stmt = db.prepare(`
      SELECT simplified, traditional, pinyin, vietnamese
      FROM   dictionary
      WHERE  simplified    LIKE $like
          OR traditional   LIKE $like
          OR pinyin        LIKE $like
          OR pinyin_plain  LIKE $likePlain
          OR vietnamese    LIKE $like
      LIMIT 30
    `);

    stmt.bind({ $like: like, $likePlain: likePlain });

    const results: DictionaryEntry[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as DictionaryEntry);
    }
    stmt.free();

    return json(results);
  } catch (err) {
    console.error('[api/search] error:', err);
    return json({ error: 'Lỗi máy chủ, vui lòng thử lại.' }, 500);
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
