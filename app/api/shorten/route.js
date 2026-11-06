
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  findUrlByOriginalUrl,
  findUrlByShortCode,
  saveUrlIfAbsent,
} from "../../../lib/db";

const MAX_URL_LENGTH = 2048;

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// 3주차: 원본 URL을 6자리 코드로 변환
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

// 오류 응답
function errorResponse(code, message, status = 400) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

// URL 단축 API
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    const raw = body?.originalUrl;
    const originalUrl =
      typeof raw === "string" ? raw.trim() : "";

    // 3주차: 빈 URL 검사
    if (!originalUrl) {
      return errorResponse(
        "MISSING_URL",
        "Original URL is required."
      );
    }

    // 3주차: URL 길이 제한
    if (originalUrl.length > MAX_URL_LENGTH) {
      return errorResponse(
        "URL_TOO_LONG",
        `URL must be ${MAX_URL_LENGTH} characters or fewer.`
      );
    }

    // 3주차: URL 형식 검사
    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return errorResponse(
        "INVALID_URL",
        "Invalid URL format."
      );
    }

    // 3주차: http, https 프로토콜만 허용
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return errorResponse(
        "INVALID_URL",
        "URL must start with http:// or https://."
      );
    }

    const baseUrl = new URL(request.url).origin;

    // 최종 과제 T10: 자기 서비스 URL 단축 차단
    const serviceHostname =
      new URL(request.url).hostname.toLowerCase();

    const targetHostname =
      parsedUrl.hostname.toLowerCase();

    if (serviceHostname === targetHostname) {
      return errorResponse(
        "SELF_URL",
        "Cannot shorten this service's own URL.",
        400
      );
    }

    // 최종 과제 T05: 동일한 URL이 이미 있는지 확인
    const existingCode =
      await findUrlByOriginalUrl(originalUrl);

    if (existingCode) {
      return NextResponse.json(
        {
          shortCode: existingCode,
          shortUrl: `${baseUrl}/${existingCode}`,
          originalUrl,
        },
        { status: 200 }
      );
    }

    // 3주차: 새로운 단축 코드 생성
    const shortCode = createShortCode(originalUrl);

    // 4주차 + 최종 과제: DB 중복 저장 방지
    const inserted =
      await saveUrlIfAbsent(shortCode, originalUrl);

    if (!inserted) {
      // 동시에 요청된 동일 URL인지 재확인
      const savedCode =
        await findUrlByOriginalUrl(originalUrl);

      if (savedCode) {
        return NextResponse.json(
          {
            shortCode: savedCode,
            shortUrl: `${baseUrl}/${savedCode}`,
            originalUrl,
          },
          { status: 200 }
        );
      }

      // 서로 다른 URL에서 같은 코드가 생성된 경우
      return errorResponse(
        "CODE_CONFLICT",
        "Short code collision.",
        409
      );
    }

    // 3주차: 생성 성공
    return NextResponse.json(
      {
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Failed to shorten URL", error);

    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to create short URL.",
      500
    );
  }
}
