import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { HTML_LANG } from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "矽鏈 Silicon Stack — 台灣 AI 供應鏈",
    template: "%s — 矽鏈 Silicon Stack",
  },
  description:
    "台灣與全球 AI 供應鏈 · 從機櫃到奈米。互動式 3D 探索、供應鏈網絡圖與台股即時行情。Taiwan & the global AI supply chain — 3D explorer, network graph and live market board.",
};

export const viewport: Viewport = {
  themeColor: "#0d1b2a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
