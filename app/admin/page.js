
"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("통계를 불러오지 못했습니다.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("ko-KR");
  }

  const summary = data?.summary;

  return (
    <main style={{
      maxWidth: "1100px",
      margin: "60px auto",
      padding: "24px",
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "30px",
      }}>
        <div>
          <h1>URL Shortener 관리자</h1>
          <p>서비스 사용량을 확인합니다.</p>
        </div>

        <button onClick={loadStats} disabled={loading}>
          {loading ? "조회 중..." : "새로고침"}
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      {summary && (
        <>
          <section style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}>
            {[
              ["전체 단축 URL", summary.totalUrls],
              ["전체 클릭 수", summary.totalClicks],
              ["클릭된 URL", summary.clickedUrls],
              [
                "최다 클릭 URL",
                summary.topUrl?.shortCode || "-",
              ],
            ].map(([label, value]) => (
              <div key={label} style={{
                padding: "24px",
                background: "#f0f4fa",
                borderRadius: "12px",
                color: "#172b4d",
              }}>
                <p>{label}</p>
                <h2>{value}</h2>
              </div>
            ))}
          </section>

          <h2>URL별 사용량</h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "750px",
            }}>
              <thead>
                <tr>
                  {[
                    "단축 코드",
                    "원본 URL",
                    "클릭 수",
                    "생성 시간",
                    "최근 클릭",
                  ].map((heading) => (
                    <th key={heading} style={{
                      padding: "12px",
                      borderBottom: "2px solid #ddd",
                      textAlign: "left",
                    }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.urls.map((url) => (
                  <tr key={url.shortCode}>
                    <td style={{ padding: "12px" }}>
                      {url.shortCode}
                    </td>
                    <td style={{
                      padding: "12px",
                      wordBreak: "break-all",
                    }}>
                      {url.originalUrl}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {url.clickCount}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {formatDate(url.createdAt)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {formatDate(url.lastClickedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && !data && <p>통계를 불러오는 중...</p>}
    </main>
  );
}
