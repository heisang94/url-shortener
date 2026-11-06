
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 4주차: URL 저장
export async function saveUrl(shortCode, originalUrl) {
  await sql`
    INSERT INTO urls (short_code, original_url)
    VALUES (${shortCode}, ${originalUrl})
  `;
}

// 5주차: 단축 코드로 원본 URL 조회
export async function findUrlByShortCode(shortCode) {
  const rows = await sql`
    SELECT original_url
    FROM urls
    WHERE short_code = ${shortCode}
    LIMIT 1
  `;

  return rows[0]?.original_url ?? null;
}

// 최종 과제 T05: 동일한 원본 URL 검색
export async function findUrlByOriginalUrl(originalUrl) {
  const rows = await sql`
    SELECT short_code
    FROM urls
    WHERE original_url = ${originalUrl}
    LIMIT 1
  `;

  return rows[0]?.short_code ?? null;
}

// 최종 과제 T05: 중복 단축 코드 저장 방지
export async function saveUrlIfAbsent(shortCode, originalUrl) {
  const rows = await sql`
    INSERT INTO urls (short_code, original_url)
    VALUES (${shortCode}, ${originalUrl})
    ON CONFLICT (short_code) DO NOTHING
    RETURNING short_code
  `;

  return rows.length > 0;
}
