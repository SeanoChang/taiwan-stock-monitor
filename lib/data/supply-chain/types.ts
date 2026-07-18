// Shape of the Taiwan × AI supply-chain graph: stages → categories → companies,
// plus the company→company relationship edges used for degree exploration.

import type { LStr } from '@/lib/i18n/config';

export type StageId =
  | 'materials'
  | 'fabsupport'
  | 'wafer'
  | 'chip'
  | 'package'
  | 'board'
  | 'subsystem'
  | 'system'
  | 'cloud'
  | 'anchor';

export interface SCStage {
  id: StageId;
  name: string;
  zh: string;
  blurb: LStr;
}

export interface SCCategory {
  id: string;
  stage: StageId;
  name: string;
  zh: string;
  desc: LStr;
  feeds: string[]; // downstream category ids
}

export interface SCRel {
  to: string; // company id
  label: LStr;
}

export interface SCCompany {
  id: string;
  cat: string;
  name: string; // English / romanized name
  zh?: string; // Chinese name
  ticker: string;
  exch: 'TWSE' | 'TPEx' | 'Emerging' | 'US' | 'JP' | 'KR' | 'EU' | 'Private';
  role: LStr;
  rel?: SCRel[];
}
