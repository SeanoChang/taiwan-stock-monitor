# Research [sourced] — 光傳輸 Optics: pluggables → LPO → CPO

> Single-pass sourcing (NVIDIA engineering blog + announcement, fetched
> 2026-07). The deep-research verify pass produced no surviving optics
> claims, so treat numbers as vendor-stated; queue for adversarial
> verification in the second pass.

## Why this branch matters（使用者點名）

Scale-up stays copper inside the rack (<2m, ~20kW/rack cheaper), but
**every rack-to-rack link is light**. At AI-factory scale the optics power
bill becomes decisive: a traditional pluggable transceiver burns **~30W per
800G port**; across "millions of GPUs" NVIDIA frames optics as ~10% of
total compute power.

## The three technology generations

1. **DSP pluggable transceivers (today, 800G → 1.6T)** — OSFP modules with
   a DSP retimer; ~30W/port; the current market (Taiwan hooks: ★眾達-KY /
   前鼎 / 光聖 modules, ★譜瑞-KY retimers, ★波若威/上詮 fiber components).
2. **LPO / LRO（線性驅動）** — drop the DSP (linear drive), big power
   savings at short reach; industry transition step.
3. **CPO 共封裝光學** — optical engines mounted beside the switch ASIC;
   fiber attaches to the package. NVIDIA figures: **9W vs 30W per port,
   3.5× power efficiency, electrical loss 22dB → ~4dB, 10× reliability
   (fewer discrete optics), 1.3× faster deployment**.

## CPO products (announced specs)

| Switch | Ports | Capacity | Ships |
|---|---|---|---|
| Quantum-X Photonics (InfiniBand) | 144× 800G | 115 Tb/s (+SHARP v4 14.4TF) | early 2026, liquid-cooled |
| Spectrum-X Photonics SN6810 (Ethernet) | 128× 800G | 102.4 Tb/s | H2 2026 |
| Spectrum-X Photonics SN6800 (Ethernet) | 512× 800G | 409.6 Tb/s | H2 2026 |

Competing CPO line: Broadcom Bailly/Davisson (Tomahawk-based) [to verify].
Architecture: TSMC-fabbed silicon-photonics engine (micro-ring modulators),
**external laser sources** (pluggable ELS — lasers stay replaceable),
detachable fiber connectors, liquid cooling.

## Taiwan angles to verify in pass 2

★上詮 FOCI (fiber array/CPO connectors, TSMC collab) · ★環宇-KY GCS
(photonics wafer foundry) · ★聯亞 LandMark (laser epi) · ★光環 LuxNet ·
transceiver assemblers 眾達/前鼎/光聖 · 華星光 — plus TSMC COUPE process.

Sources: NVIDIA CPO engineering blog (developer.nvidia.com/blog/scaling-ai-
factories-with-co-packaged-optics-for-better-power-efficiency/) · NVIDIA
newsroom Spectrum-X/Quantum-X Photonics announcement · ServeTheHome CPO
coverage · MapYourTech CPO architecture overview.
