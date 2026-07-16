import type { Metadata } from "next";
import { SiliconStackExplorer } from "@/components/explorer/silicon-stack-explorer";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "矽鏈 Silicon Stack — 台灣 AI 供應鏈 3D 探索",
  description:
    "從資料中心機櫃到 4 奈米電晶體的互動式 3D 供應鏈探索。Interactive 3D journey through the AI supply chain, from rack to nanometer.",
};

export default async function HomePage() {
  const locale = await getLocale();
  return <SiliconStackExplorer locale={locale} />;
}
