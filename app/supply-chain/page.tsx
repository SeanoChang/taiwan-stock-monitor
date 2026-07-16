import type { Metadata } from "next";
import { SupplyChainGraph } from "@/components/graph/supply-chain-graph";
import { COMPANY_MAP } from "@/lib/data/supply-chain";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "台灣 AI 供應鏈網絡圖",
  description:
    "台股 AI 供應鏈完整網絡圖：材料、EUV 零組件、晶圓、代工、封測、電路板、散熱、電源、伺服器與雲端 — 支援一度／二度關聯追蹤與即時行情。Force-directed network graph of Taiwan's AI supply chain with live quotes.",
};

interface PageProps {
  searchParams: Promise<{ focus?: string }>;
}

export default async function SupplyChainPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const { focus } = await searchParams;
  const validFocus = focus && COMPANY_MAP[focus] ? focus : undefined;
  return <SupplyChainGraph locale={locale} focus={validFocus} />;
}
