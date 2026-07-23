// UI string dictionary — universal module (server & client safe).

import { l } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';

export const UI = {
  // shared chrome
  brandSub: l(
    'Taiwan & the global AI supply chain · from rack to nanometer',
    '台灣與全球 AI 供應鏈 · 從機櫃到奈米',
  ),
  illustrative: l('Illustrative data · 15 Jul 2026', '示意資料 · 2026/07/15'),
  notAdvice: l('Curated snapshot · not investment advice', '整理快照 · 非投資建議'),
  close: l('Close', '關閉'),
  navExplorer: l('3D Explorer', '3D 探索'),
  navGraph: l('Network graph', '供應鏈網絡圖'),

  // explorer
  guidedTour: l('Guided tour', '導覽模式'),
  exitTour: l('Exit tour', '結束導覽'),
  zoomOut: l('↖ Out', '↖ 上一層'),
  zoomOutTitle: l('Zoom out one level', '回到上一個尺度'),
  marketCap: l('Market cap', '市值'),
  position: l('Position', '市場地位'),
  supplyChainSec: l('Supply chain', '供應鏈關係'),
  panelDisclaimer: l(
    'Live quotes where available; other figures are an illustrative snapshot — not investment advice.',
    '可取得處顯示即時行情；其餘為示意快照 — 非投資建議。',
  ),
  preparing: l('Preparing the data center…', '資料中心準備中…'),
  loadError: l(
    'Couldn’t load the 3D engine. Reload to retry.',
    '3D 引擎載入失敗，請重新整理再試。',
  ),

  // graph
  graphTitle: l('Supply-chain network', '供應鏈網絡圖'),
  searchPlaceholder: l('Search name / 中文 / ticker / role…', '搜尋公司 / 代號 / 領域…'),
  matches: l('matches', '筆符合'),
  graphCounts: l('Taiwan-listed companies', '家台股公司'),
  nodes: l('nodes', '個節點'),
  segments: l('chain segments', '個供應鏈節點'),
  graphHint: l(
    'Drag to pan · Scroll to zoom · Click a node to trace its links · Drag nodes to rearrange',
    '拖曳平移 · 滾輪縮放 · 點擊節點追蹤關聯 · 拖曳節點重新排列',
  ),
  linkedTo: l('Linked to', '關聯對象'),
  referencedBy: l('Referenced by', '被引用於'),
  members: l('Members', '節點成員'),
  listedTWSE: l('listed', '上市'),
  listedTPEx: l('listed', '上櫃'),
  graphDisclaimer: l(
    'Curated mapping for research navigation — verify tickers, listings and relationships against primary sources before acting on them.',
    '本圖譜為研究導覽用之整理資料 — 下單前請以原始資料來源核實代號、市場別與供應鏈關係。',
  ),
  clearFilter: l('Clear', '清除'),

  // quotes (company panel)
  live: l('Live', '即時'),
} satisfies Record<string, LStr>;

export type UIKey = keyof typeof UI;

export function t(key: UIKey, locale: Locale): string {
  return UI[key][locale];
}
