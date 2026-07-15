// Locale primitives + UI string dictionary (framework-free, importable anywhere).
// Default locale is Traditional Chinese (Taiwan); English is the alternate.

export type Locale = 'zh' | 'en'; // 'zh' = zh-Hant-TW

export interface LStr {
  en: string;
  zh: string;
}

/** shorthand constructor for bilingual strings */
export const l = (en: string, zh: string): LStr => ({ en, zh });

export const DEFAULT_LOCALE: Locale = 'zh';
export const HTML_LANG: Record<Locale, string> = { zh: 'zh-Hant-TW', en: 'en' };

// ---------- UI strings ----------
export const UI: Record<string, LStr> = {
  // shared
  brandSub: l('Taiwan & the global AI supply chain · from rack to nanometer', '台灣與全球 AI 供應鏈 · 從機櫃到奈米'),
  illustrative: l('Illustrative data · 15 Jul 2026', '示意資料 · 2026/07/15'),
  notAdvice: l('Curated snapshot · Jul 2026 · not investment advice', '整理快照 · 2026/07 · 非投資建議'),
  langToggle: l('繁中', 'EN'), // label shows the OTHER locale to switch to

  // explorer
  guidedTour: l('Guided tour', '導覽模式'),
  exitTour: l('Exit tour', '結束導覽'),
  supplyChainMap: l('Supply chain map →', '供應鏈圖譜 →'),
  zoomOut: l('↖ Out', '↖ 上一層'),
  zoomOutTitle: l('Zoom out one level', '回到上一個尺度'),
  marketCap: l('Market cap', '市值'),
  position: l('Position', '市場地位'),
  supplyChainSec: l('Supply chain', '供應鏈關係'),
  panelDisclaimer: l(
    'Illustrative snapshot for design purposes — not live quotes, not investment advice.',
    '僅為設計示意快照 — 非即時報價，亦非投資建議。'
  ),
  preparing: l('Preparing the data center…', '資料中心準備中…'),
  loadError: l('Couldn’t load the 3D engine. Reload to retry.', '3D 引擎載入失敗，請重新整理再試。'),
  close: l('Close', '關閉'),

  // graph page
  graphTitle: l('Supply-chain network', '供應鏈網絡圖'),
  backExplorer: l('← 3D Explorer', '← 3D 探索'),
  searchPlaceholder: l('Search name / 中文 / ticker / role…', '搜尋公司 / 代號 / 領域…'),
  matches: l('matches', '筆符合'),
  match: l('match', '筆符合'),
  graphCounts: l('Taiwan-listed companies', '家台股公司'),
  nodes: l('nodes', '個節點'),
  segments: l('chain segments', '個供應鏈節點'),
  graphHint: l(
    'Drag to pan · Scroll to zoom · Click a node to trace its links · Drag nodes to rearrange',
    '拖曳平移 · 滾輪縮放 · 點擊節點追蹤關聯 · 拖曳節點重新排列'
  ),
  linkedTo: l('Linked to', '關聯對象'),
  referencedBy: l('Referenced by', '被引用於'),
  listedTWSE: l('listed', '上市'),
  listedTPEx: l('listed', '上櫃'),
  foreignAnchor: l('Foreign / private anchor', '外商／未上市'),
  graphDisclaimer: l(
    'Curated mapping for research navigation — verify tickers, listings and relationships against primary sources before acting on them.',
    '本圖譜為研究導覽用之整理資料 — 下單前請以原始資料來源核實代號、市場別與供應鏈關係。'
  ),
  clearFilter: l('Clear', '清除'),
  anchorsGroup: l('Global anchors', '全球夥伴'),
};
