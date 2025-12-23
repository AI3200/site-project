import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "site-project",
    template: "%s | site-project",
  },
  description: "GitHub Pages × Next.js SSG sample site.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen bg-white text-gray-900">
          <header className="border-b">
            <div className="mx-auto max-w-5xl px-6 py-4">
              <h1 className="text-xl font-semibold">site-project</h1>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-6 py-12">
            {children}
          </main>

          <footer className="border-t">
            <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-gray-500">
              © {new Date().getFullYear()} site-project
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
