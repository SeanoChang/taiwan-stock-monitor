# Research [verified] — GPU silicon, HBM datapath, CoWoS, scale-up fabric

All 3-0 verified (2026-07-17) unless noted.

## Blackwell Ultra GPU

Dual-reticle GPU, **208B transistors, TSMC 4NP**, two dies joined by
**NV-HBI at 10 TB/s**. **160 SMs** (two dies) = 20,480 CUDA cores; per SM:
128 CUDA cores, 4× 5th-gen Tensor Cores, **256KB TMEM**. 15 PFLOPS dense
NVFP4, up to 1,400W TGP. Superchip = 1 Grace + 2 GPUs, 1TB unified
HBM3e+LPDDR5X; rack = 36 superchips ≈ 1.1 EF dense FP4 (vendor peaks).
Source: NVIDIA Blackwell Ultra architecture blog + GB300 product page.

## HBM ↔ SM datapath（記憶體怎麼餵 SM）

Per GPU: **288GB HBM3e in 8× 12-Hi stacks (36GB each)**, driven by
**16× 512-bit memory controllers (8,192-bit total)** → **8 TB/s** per GPU
(2.4× H100's 3.35 TB/s). Host paths: NVLink-C2C to Grace **900 GB/s
(coherent)**; PCIe Gen6 ×16 **256 GB/s**.
Gaps: L2 cache size, HBM stack internals (TSV/base die), HBM vendor split,
HBM4 — not in verified set (HBM4 2,048-bit/10GT/s is sourced via
Tom's Hardware, single-pass).

## CoWoS packaging (★台積電 2330 — sole supplier of this step)

CoWoS-S: HBM cubes over silicon interposer w/ deep-trench caps, up to
3.3× reticle (~2,700mm²). Beyond → **CoWoS-L** (Blackwell's platform):
RDL interposer + embedded **LSI chiplets** (sub-micron copper die-to-die
routing) + **eDTC** under the SoC for power integrity.
Source: TSMC 3DFabric (live-fetched) + IEEE ECTC.

## Scale-up fabric (NVLink 5 over copper)

Flat **one-hop NVSwitch topology** (a "full-mesh" description was REFUTED
1-2). Per GPU: 18 links × 100GB/s = **1.8 TB/s bidirectional**; rack
aggregate ~130 TB/s over a passive copper cable cartridge of **5,184
cables** (72 diff pairs/GPU). Switch tray: 2 chips × 72 ports, 57.6 Tb/s.
**Why copper**: saves ~20kW/rack vs optical transceivers at rack distances.
Physical layer: Amphenol Paladin connectors (144 pairs switch-side / 72
GPU-side), SkewClear EXD Gen2, OverPass flyovers (Amphenol = US-listed APH;
no TW interconnect vendor survived verification).
NVLink 6 (3.6TB/s) belongs to Vera Rubin NVL144 — next-gen node [gap].

## Open scale-up standard

**UALink 200G 1.0** (Apr 2025): memory-semantic (load/store/atomic,
64–256B), up to 1,024 accelerators/pod, 200Gbps/lane over commodity IEEE
802.3 PAM4 PHYs, 93% efficiency target. Ratified spec; no shipping silicon
verified. Source: UALink Consortium white paper + press release.
