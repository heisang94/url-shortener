
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { saveUrl } from "../../../lib/db";


export const runtime = "nodejs";

const MAX_URL_LENGTH = 2048;

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/*
 * createShortCode()
 *
 * 원본 URL을 입력받아 SHA-256 해시를 생성하고,
 * 그 값을 이용해 6자리 short code를 만듭니다.
 */
function createShortCode(originalUrl, length = 6) {
  const hex = createHash("sha256")
    .update(originalUrl)
    .digest("hex");

  let code = "";

  for (let i = 0; i < length; i++) {
    const value = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );

    code += ALPHABET[value % ALPHABET.length];
  }

  return code;
}

/*
 * POST()
 *
 * 클라이언트가 보낸 URL을 검사하고,
 * 문제가 없으면 short URL을 생성하여 반환합니다.
 */
export async function POST(request) {
  try {
    /*
     * 1. 요청 body 읽기
     */
    const body = await request.json().catch(() => null);

    const raw = body?.originalUrl;
    const originalUrl =
      typeof raw === "string" ? raw.trim() : "";

    /*
     * 2. URL이 입력되지 않은 경우
     *
     * TODO: HTTP 상태 코드 수정
     */
    if (!originalUrl) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_URL",
            message: "Original URL is required.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * 3. URL이 너무 긴 경우
     *
     * TODO: HTTP 상태 코드 수정
     */
    if (originalUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "URL_TOO_LONG",
            message:
              `URL must be ${MAX_URL_LENGTH} characters or fewer.`,
          },
        },
        { status: 400 }
      );
    }

    /*
     * 4. URL 형식 검사
     */
    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      /*
       * TODO: HTTP 상태 코드 수정
       */
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message:
              "URL must start with http:// or https://.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * 5. 프로토콜 검사
     */
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      /*
       * TODO: HTTP 상태 코드 수정
       */
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message:
              "URL must start with http:// or https://.",
          },
        },
        { status: 400 }
      );
    }

    /*
     * 6. Short URL 생성
     */
    const shortCode = createShortCode(originalUrl);

    // 4주차 실습: 생성한 URL 매핑을 Neon DB에 저장
    await saveUrl(shortCode, originalUrl);
    
    const baseUrl = new URL(request.url).origin;

    /*
     * URL 생성 성공
     *
     * TODO: HTTP 상태 코드 수정
     */
    return NextResponse.json(
      {
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    /*
     * 7. 서버 내부 오류
     *
     * TODO: HTTP 상태 코드 수정
     */
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create short URL.",
        },
      },
      { status: 500 }
    );
  }
}
