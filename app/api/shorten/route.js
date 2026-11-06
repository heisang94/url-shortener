import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";

function makeCode() {
  return randomBytes(12).toString("base64url").slice(0, 6);
}

function errorResponse(code, message, status = 400) {
  return Response.json(
    { error: { code, message } },
    { status }
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const originalUrl = body?.originalUrl;

    // 1. URL 입력 여부 확인
    if (
      typeof originalUrl !== "string" ||
      originalUrl.trim() === ""
    ) {
      return errorResponse("MISSING_URL", "URL을 입력하세요.");
    }

    let parsed;

    // 2. 올바른 URL인지 확인
    try {
      parsed = new URL(originalUrl);

      if (
        !["http:", "https:"].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password
      ) {
        throw new Error("Invalid URL");
      }
    } catch {
      return errorResponse("INVALID_URL", "잘못된 URL입니다.");
    }

    // 3. 자기 서비스 URL 단축 차단
    const serviceHost = new URL(request.url).hostname.toLowerCase();

    if (parsed.hostname.toLowerCase() === serviceHost) {
      return errorResponse(
        "SELF_URL",
        "자기 서비스 주소는 단축할 수 없습니다."
      );
    }

    const sql = getDb();

    // 4. 중복된 URL이 있는지 확인
    const existing = await sql`
      SELECT short_code
      FROM urls
      WHERE original_url = ${originalUrl}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const shortCode = existing[0].short_code;

      return Response.json({
        originalUrl,
        shortCode,
        shortUrl: `${new URL(request.url).origin}/${shortCode}`
      }, { status: 200 });
    }

    // 5. 새로운 단축 코드 생성
    const shortCode = makeCode();

    // 6. DB에 저장
    // 동시에 같은 URL이 요청되어도 기존 코드 사용
    const saved = await sql`
      INSERT INTO urls (original_url, short_code)
      VALUES (${originalUrl}, ${shortCode})
      ON CONFLICT (original_url)
      DO UPDATE SET original_url = EXCLUDED.original_url
      RETURNING short_code
    `;

    const finalCode = saved[0].short_code;

    return Response.json({
      originalUrl,
      shortCode: finalCode,
      shortUrl: `${new URL(request.url).origin}/${finalCode}`
    }, { status: 201 });

  } catch (error) {
    console.error(error);

    return errorResponse(
      "SERVER_ERROR",
      "서버 오류가 발생했습니다.",
      500
    );
  }
}
