import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const { shortCode } = await params;

  if (!/^[A-Za-z0-9_-]{6}$/.test(shortCode)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const sql = getDb();

    const rows = await sql`
      SELECT original_url
      FROM urls
      WHERE short_code = ${shortCode}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(null, {
      status: 307,
      headers: {
        Location: rows[0].original_url,
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error(error);

    return new Response("Server Error", {
      status: 500
    });
  }
}
