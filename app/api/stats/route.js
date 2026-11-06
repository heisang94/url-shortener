export async function GET() {
  return Response.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "인증이 필요합니다."
      }
    },
    { status: 401 }
  );
}
