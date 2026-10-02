import type { Metadata } from "next";
import "./globals.css";
import {BRAND_ICON_URL} from '../lib/brand';

export const metadata: Metadata = {
  title: "读词 · 考研英语一阅读词汇",
  description: "2010—2026 年英语一阅读真题词汇，按篇刷词、记录进步、复习错词。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: BRAND_ICON_URL,
    shortcut: BRAND_ICON_URL,
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
