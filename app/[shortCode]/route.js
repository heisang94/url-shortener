import { findUrlByShortCode } from "../../lib/db";
import { recordClick } from "../../lib/stats";

export async function GET(request, { params }) {
  const { shortCode } = await params;

  const originalUrl = await findUrlByShortCode(shortCode);

  // TODO
  // originalUrl이 존재하지 않는 경우
  // 404 Not Found 응답을 반환하세요.
  if (!originalUrl) {
    return new Response("Not Found", {
      status: 404,
    });
  }

  // 정상적인 URL만 클릭 수 기록
  try {
    await recordClick(shortCode);
  } catch (error) {
    console.error("Failed to record click", {
      shortCode,
      error,
    });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: originalUrl,
      "Cache-Control": "no-store",
    },
  });
}