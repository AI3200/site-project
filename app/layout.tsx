// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "おどるクイズシリーズ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}

        {/* ✅ フッターはここだけ */}
        <footer
          style={{
            textAlign: "center",
            padding: "28px 12px",
            fontSize: "12px",
            color: "rgba(17,24,39,.45)",
          }}
        >
          © 一般社団法人スマートライフ教育研究所
        </footer>
      </body>
    </html>
  );
}
