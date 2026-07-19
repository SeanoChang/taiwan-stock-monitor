import type { Metadata } from 'next';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { Reveal } from '@/components/site/reveal';
import { SiteHeader } from '@/components/site/site-header';
import { StackExplorer } from '@/components/stack/stack-explorer';
import { l, pick } from '@/lib/i18n/config';
import { getLocale } from '@/lib/i18n/server';
import { getQuotes } from '@/lib/server/quotes';

export const metadata: Metadata = {
  title: '堆疊探索 Stack Explorer',
  description:
    '多角度探索 AI 伺服器堆疊：機構包含、資料／電力／散熱流、子系統與供應鏈階段 — 每個節點皆標示驗證信心並連結台股供應商即時行情。Multi-axis explorer of the AI-server hardware stack — every node marked ✓/※/？ and linked to its Taiwan supplier with a live quote.',
};

// Page-local bilingual copy (design-restyle precedent: app/market/page.tsx's
// own MARKET_HEADLINE) — kept next to its one call site rather than the
// shared UI dict, since Plan 006 Phase G's file scope is additive/isolated
// and doesn't touch lib/i18n/dict.ts.
const STACK_EYEBROW = l('Stack explorer', '堆疊探索');
const STACK_HEADLINE = l('One stack, six angles', '同一套硬體，六個角度');
const STACK_SUB = l(
  'Containment, data/power/heat flow, subsystem and supply-chain stage — every node still resolves to its Taiwan supplier and a live quote.',
  '機構包含、資料／電力／散熱流、子系統與供應鏈階段 — 每個節點仍會連回台股供應商與即時行情。',
);

/**
 * Server shell for `/stack` (Plan 006 Phase G, Task 3): metadata + the same
 * sticky product-bar chrome `/market` uses (`SiteHeader`/`Brand`/
 * `LocaleToggle`/`NavLinks`), plus one server-only data fetch —
 * `getQuotes()` — threaded into `<StackExplorer>` as the seed payload for
 * its `useQuotes()` call. All navigation state (axis/current node) lives in
 * the URL hash, owned entirely client-side by `StackExplorer`; this page
 * never reads `searchParams` because a hash fragment is never sent to the
 * server (see stack-explorer.tsx's own module doc).
 */
export default async function StackPage() {
  const [locale, quotes] = await Promise.all([getLocale(), getQuotes()]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader
        brand={<Brand locale={locale} />}
        tools={
          <>
            <LocaleToggle locale={locale} />
            <NavLinks locale={locale} current="/stack" />
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <Reveal as="section">
          <p className="text-eyebrow">{pick(STACK_EYEBROW, locale)}</p>
          <h1 className="text-headline mt-2">{pick(STACK_HEADLINE, locale)}</h1>
          <p className="text-body text-muted-foreground mt-3 max-w-2xl">
            {pick(STACK_SUB, locale)}
          </p>
        </Reveal>

        <StackExplorer locale={locale} quotes={quotes} />
      </main>
    </div>
  );
}
