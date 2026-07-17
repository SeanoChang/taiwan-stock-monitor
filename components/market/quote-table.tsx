// Server-rendered quote table for the market board.

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PALETTE, STAGE_GROUP } from '@/components/graph/graph-model';
import { CATEGORY_MAP } from '@/lib/data/supply-chain';
import { fmtPct, fmtSigned, upDownColor } from '@/lib/format';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import type { MarketRow } from '@/components/market/market-rows';

export type { MarketRow };

export function QuoteTable({ rows, locale }: { rows: MarketRow[]; locale: Locale }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-foreground/45 w-20">{t('colCode', locale)}</TableHead>
          <TableHead className="text-foreground/45">{t('colName', locale)}</TableHead>
          <TableHead className="text-foreground/45">{t('colSegment', locale)}</TableHead>
          <TableHead className="text-foreground/45 text-right">{t('colClose', locale)}</TableHead>
          <TableHead className="text-foreground/45 text-right">{t('colChange', locale)}</TableHead>
          <TableHead className="text-foreground/45 text-right">
            {t('colChangePct', locale)}
          </TableHead>
          <TableHead className="text-foreground/45 text-right">{t('colVolume', locale)}</TableHead>
          <TableHead className="text-foreground/45 w-16">{t('colMarket', locale)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ company, quote }) => {
          const cat = CATEGORY_MAP[company.cat];
          const ink = quote ? upDownColor(quote.change, locale) : undefined;
          return (
            <TableRow key={company.id} className="border-border/60 hover:bg-accent/60">
              <TableCell className="text-primary font-mono text-xs">{company.ticker}</TableCell>
              <TableCell>
                <Link
                  href={`/supply-chain?focus=${company.id}`}
                  title={t('viewInGraph', locale)}
                  className="group flex items-baseline gap-2"
                >
                  <span className="group-hover:text-primary text-[13px] font-semibold">
                    {locale === 'zh' ? (company.zh ?? company.name) : company.name}
                  </span>
                  <span className="text-foreground/45 hidden text-[11px] sm:inline">
                    {locale === 'zh' ? company.name : company.zh}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-foreground/65 flex items-center gap-1.5 text-[11.5px]">
                  <span
                    className="size-2 flex-none rounded-full"
                    style={{ background: PALETTE[STAGE_GROUP[cat.stage]] }}
                  />
                  {locale === 'zh' ? cat.zh : cat.name}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-[13px] tabular-nums">
                {quote ? quote.close.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
              </TableCell>
              <TableCell
                className="text-right font-mono text-[12.5px] tabular-nums"
                style={{ color: ink }}
              >
                {quote ? fmtSigned(quote.change) : '—'}
              </TableCell>
              <TableCell
                className="text-right font-mono text-[12.5px] font-semibold tabular-nums"
                style={{ color: ink }}
              >
                {quote ? fmtPct(quote.changePct) : '—'}
              </TableCell>
              <TableCell className="text-foreground/65 text-right font-mono text-xs tabular-nums">
                {quote ? quote.volume.toLocaleString() : '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="border-border text-foreground/55 rounded px-1.5 py-0 text-[10px] font-normal"
                >
                  {company.exch}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
