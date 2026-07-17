// Shape of the Silicon Stack dataset: scale levels and the company cards
// (quote fields are placeholders a live API can later fill in).

import type { LStr } from '@/lib/i18n/config';

export interface Level {
  id: number;
  key: string;
  name: LStr;
  zh: string; // short zh tag shown beside the scale
  scale: string;
  blurb: LStr;
}

export interface CompanyLink {
  to: string;
  label: LStr;
}

export interface Company {
  short: string;
  name: string;
  ticker: string;
  exch: string;
  country: LStr;
  private?: boolean;
  note?: LStr;
  priceText: string;
  chg: number;
  mcapText: string;
  role: LStr;
  share: LStr;
  desc: LStr;
  links: CompanyLink[];
}
