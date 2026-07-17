# Tokens — Silicon Stack × Apple grammar (feeds app/globals.css)

Apple's measured values adapted to our dark-first, zh-first product.

## Color

| Token                | Value                    | Note                                         |
| -------------------- | ------------------------ | -------------------------------------------- |
| `--background`       | `#0b0d10`                | near-black sections (Apple pro-page pattern) |
| `--surface-1`        | `#101317`                | alt sections                                 |
| `--card`             | `#15181d`                | cards/panels                                 |
| `--foreground`       | `#f5f5f7`                | Apple's light gray as INK on dark            |
| `--muted-foreground` | `#a1a1a6`                | body gray (≥4.5:1 on background)             |
| `--tertiary`         | `#6e6e73`                | captions (measured Apple gray)               |
| `--primary`          | `#ffb703`                | amber replaces #0071e3 as the single accent  |
| `--border`           | `rgba(255,255,255,0.08)` | hairlines                                    |

**Open decision for Sean**: navy `#0d1b2a` stays only as the 3D stage
backdrop (recommended) or remains the page background.

## Type ramp (marketing surfaces; `--font-marketing`)

`-apple-system, "SF Pro Display", "SF Pro TC", "PingFang TC", "Noto Sans TC", system-ui, sans-serif`

| Class                          | Size clamp   | Weight en / zh | Tracking                   |
| ------------------------------ | ------------ | -------------- | -------------------------- |
| `.text-display`                | 56→96px      | 600 / 500      | −0.015em                   |
| `.text-headline`               | 40→64px      | 600 / 500      | −0.012em                   |
| `.text-title`                  | 28→40px      | 600 / 500      | −0.01em                    |
| `.text-eyebrow`                | 12→14px      | 600            | +0.1em (uppercase en only) |
| `.text-body-lg` / `.text-body` | 19→21 / 17px | 400            | 0                          |

Geist stays for code/tabular numerals only (quotes tables).

## Shape · spacing · motion

Pill radius 999px · card radius 20px (`--radius: 1.25rem`) · section
padding-y `clamp(96px, 14vh, 200px)` · text column 980px / media 1280px.

| Motion token                                  | Value                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `--ease-apple`                                | `cubic-bezier(0.25, 0.1, 0.3, 1)` (measured signature)                  |
| `--ease-snappy`                               | `cubic-bezier(0.4, 0, 0.6, 1)` (micro-interactions)                     |
| `--dur-micro` / `--dur-reveal` / `--dur-hero` | 160ms / 600ms / 1000ms                                                  |
| reveal                                        | translateY(24px)+fade, once, IntersectionObserver, reduced-motion no-op |

Non-negotiables kept: zh-Hant-TW first, stage palette, 紅漲綠跌 logic,
disclaimers, amber-never-as-body-text.
