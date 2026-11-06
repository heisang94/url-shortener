
import { NextResponse } from "next/server";
import {
  getSummaryStats,
  getTopUrl,
  getUrlStats,
} from "../../../lib/stats";

import { authenticate } from "../../../lib/auth";
import { authorize } from "../../../lib/authorization";

function authenticationRequiredResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
      "Cache-Control": "no-store",
    },
  });
}

function forbiddenResponse() {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request) {
  // TODO 3: 관리자 인증 및 통계 조회 권한 확인
  const user = authenticate(request);

  if (!user) {
    return authenticationRequiredResponse();
  }

  if (!authorize(user, "stats:read")) {
    return forbiddenResponse();
  }

  // 6주차 통계 조회 기능 유지
  try {
    const summary = await getSummaryStats();
    const topUrl = await getTopUrl();
    const urls = await getUrlStats();

    return NextResponse.json(
      {
        summary: {
          ...summary,
          topUrl,
        },
        urls,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Failed to load statistics", error);

    return NextResponse.json(
      {
        error: {
          code: "STATS_ERROR",
          message: "Failed to load statistics.",
        },
      },
      { status: 500 }
    );
  }
}
