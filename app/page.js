
"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function shorten(e) {
    e.preventDefault();
    setResult("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ originalUrl: url })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error?.message || "오류가 발생했습니다.");
        return;
      }

      setResult(data.shortUrl);
    } catch {
      setMessage("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      maxWidth: 600,
      margin: "100px auto",
      padding: 24,
      fontFamily: "Arial, sans-serif"
    }}>
      <h1>URL Shortener</h1>
      <p>긴 URL을 짧게 만들어 보세요.</p>

      <form onSubmit={shorten}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          style={{
            padding: 12,
            width: "100%",
            boxSizing: "border-box"
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "12px 24px",
            cursor: "pointer"
          }}
        >
          {loading ? "처리 중..." : "URL 단축하기"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          <p>단축된 URL:</p>
          <a href={result} target="_blank" rel="noreferrer">
            {result}
          </a>
        </div>
      )}

      {message && (
        <p style={{ color: "red", marginTop: 20 }}>
          {message}
        </p>
      )}
    </main>
  );
}
