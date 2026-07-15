import type { Metadata } from "next";
import SupplyChainGraph from "@/components/supply-chain-graph";

export const metadata: Metadata = {
  title: "台灣 AI 供應鏈網絡圖 — 矽鏈 Silicon Stack",
  description:
    "台股 AI 供應鏈完整網絡圖：材料、EUV 零組件、晶圓、代工、封測、電路板、散熱、電源、伺服器與雲端 — 支援一度／二度關聯追蹤。Force-directed network graph of Taiwan's AI supply chain with 1st/2nd-degree relationship tracing.",
};

export default function SupplyChainPage() {
  return <SupplyChainGraph />;
}
