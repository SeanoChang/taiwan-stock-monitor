# Research — Apple.com design tokens (extracted from the live site)

Extraction of apple.com's computed styles (designlang, fetched 2026-07),
cross-checked with Apple HIG typography:

## Typography (measured)

- Families: **SF Pro Text** (body, ~1.7k uses), **SF Pro Display** (headlines).
  Web licensing: don't self-host SF — use `-apple-system` stack (renders SF on
  Apple hardware, falls back cleanly elsewhere).
- Measured ramp: H1 56px/600/60 · H2 40px/600/44 · H3 34px/600/50 ·
  body 17px-class/400. Weights in use: 300/400/600/700 (600 dominates
  headlines — Apple rarely uses 700 on marketing pages).

## Color (measured)

- Light surface `#f5f5f7` · dark text `#1d1d1f` · body grays `#86868b`,
  `#6e6e73` · hairline `#e8e8ed` · link/CTA blue `#0071e3` · pure #000
  sections for pro/dark products (MacBook Pro page pattern — our reference).

## Shape / spacing / motion (measured)

- Radii: 5 · 8 · 11 · 50 · **980px (the pill)**.
- Spacing steps cluster ~24–53px; sections breathe far more (100–200px).
- Durations: 20 / 100 / 160 / 300 / 1000ms. Easings:
  `cubic-bezier(0.4, 0, 0.6, 1)` and `cubic-bezier(0.25, 0.1, 0.3, 1)` —
  the latter is the signature slow-settle for reveals.
- Copy voice: eyebrow + fragment headline; CTA verbs (learn/buy/watch);
  quiet chevron links.

## Sources

- Token extraction: https://www.designlang.app/gallery/apple-com
- Apple HIG typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Community DESIGN.md distillations: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md · https://superdesign.dev/blog/apple-design-system
- Mac Studio page (grammar reference): https://www.apple.com/mac-studio/
