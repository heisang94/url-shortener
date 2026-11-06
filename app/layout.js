
export const metadata = {
  title: "URL Shortener",
  description: "클라우드 컴퓨팅 URL 단축 서비스"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
