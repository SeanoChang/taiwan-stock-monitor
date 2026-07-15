import type { Metadata } from "next";
import SupplyChainGraph from "@/components/supply-chain-graph";

export const metadata: Metadata = {
  title: "Taiwan × AI Supply Chain Map — Silicon Stack 矽鏈",
  description:
    "Exhaustive node graph of Taiwan-listed companies in the AI supply chain — materials, EUV parts, wafers, foundry, packaging, boards, cooling, power, servers and cloud — with first- and second-degree relationship tracing.",
};

export default function SupplyChainPage() {
  return <SupplyChainGraph />;
}
