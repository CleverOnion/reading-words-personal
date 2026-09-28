import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "读词 · 考研英语一阅读词汇",
  description: "2010—2026 年英语一阅读真题词汇，按篇刷词、记录进步、复习错词。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
