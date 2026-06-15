import type { APIRoute } from 'astro';
import { getDb, removeTones } from '@/lib/db';

export const prerender = false;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

export const GET: APIRoute = async ({ url }) => {
  const q     = url.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  if (!q) return json([]);

  try {
    const db         = await getDb();
    const like       = `%${q}%`;
    const likePrefix = `${q}%`;
    const plainQ     = removeTones(q);
    const likePlain  = `%${plainQ}%`;
    const likePlainPfx = `${plainQ}%`;

    /**
     * Chiến lược sắp xếp ưu tiên:
     *   0 — khớp chính xác giản thể
     *   1 — khớp chính xác phồn thể
     *   2 — khớp chính xác pinyin (không dấu)
     *   3 — khớp chính xác tiếng Việt
     *   4 — bắt đầu bằng giản thể / phồn thể
     *   5 — bắt đầu bằng pinyin không dấu
     *   6 — bắt đầu bằng tiếng Việt
     *   7 — khớp một phần (contains)
     */
    const stmt = db.prepare(`
      SELECT id, simplified, traditional, pinyin, vietnamese, hsk_level,
        CASE
          WHEN simplified   =  $q           THEN 0
          WHEN traditional  =  $q           THEN 1
          WHEN pinyin_plain =  $plainQ       THEN 2
          WHEN vietnamese   =  $q           THEN 3
          WHEN simplified   LIKE $pfx       THEN 4
          WHEN traditional  LIKE $pfx       THEN 4
          WHEN pinyin_plain LIKE $pfxPlain   THEN 5
          WHEN vietnamese   LIKE $pfx        THEN 6
          ELSE 7
        END AS _score
      FROM dictionary
      WHERE simplified    LIKE $like
         OR traditional   LIKE $like
         OR pinyin        LIKE $like
         OR pinyin_plain  LIKE $likePlain
         OR vietnamese    LIKE $like
      ORDER BY _score ASC, hsk_level ASC NULLS LAST, length(simplified) ASC
      LIMIT $limit
    `);

    stmt.bind({
      $q:        q,
      $plainQ:   plainQ,
      $like:     like,
      $likePlain: likePlain,
      $pfx:      likePrefix,
      $pfxPlain: likePlainPfx,
      $limit:    limit,
    });

    const results: object[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      delete row['_score'];
      results.push(row);
    }
    stmt.free();

    return json(results);
  } catch (err) {
    console.error('[api/search]', err);
    return json({ error: 'Lỗi máy chủ, vui lòng thử lại.' }, 500);
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
