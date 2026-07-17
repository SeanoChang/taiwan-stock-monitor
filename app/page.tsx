import type { Metadata } from 'next';
import { SiliconStackExplorer } from '@/components/explorer/silicon-stack-explorer';
import { explorerCopy } from '@/components/explorer/explorer-copy';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { Badge } from '@/components/ui/badge';
import { getLocale } from '@/lib/i18n/server';
import { t } from '@/lib/i18n/dict';

export const metadata: Metadata = {
  title: '矽鏈 Silicon Stack — 台灣 AI 供應鏈 3D 探索',
  description:
    '從資料中心機櫃到 4 奈米電晶體的互動式 3D 供應鏈探索。Interactive 3D journey through the AI supply chain, from rack to nanometer.',
};

export default async function HomePage() {
  const locale = await getLocale();
  return (
    <SiliconStackExplorer
      locale={locale}
      copy={explorerCopy(locale)}
      brand={<Brand locale={locale} tagline />}
      tools={
        <>
          <LocaleToggle locale={locale} />
          <NavLinks locale={locale} current="/" />
          <Badge
            variant="outline"
            className="border-border text-foreground/45 rounded-full px-2.5 py-1 text-[10.5px] font-normal tracking-wide"
          >
            {t('illustrative', locale)}
          </Badge>
        </>
      }
    />
  );
}
