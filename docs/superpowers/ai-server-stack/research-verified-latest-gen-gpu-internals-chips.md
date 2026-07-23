# Research — latest AI-server gen · GPU microarchitecture · full chip complement

- **Date:** 2026-07-19 · 3 parallel research agents, web-sourced.
- **Trigger:** user review — "the GPU server seems less than the latest; GPU
  architecture lacks detail (L1/L2/SM, not just HBM); chips are missing."
- **Tier:** **[s] sourced** (each claim has a URL; not yet adversarially re-voted).
  Build spec: plan 007 — see `../plans.md` (individual plan files were
  consolidated there in the 2026-07 cleanup).

## 1. Generation — the model is one gen behind

The tree/scene model **GB300 NVL72 (Blackwell Ultra)** = the _currently-shipping_
product, **not the latest**. The latest is **Vera Rubin NVL72 (a.k.a. NVL144)** —
announced GTC 2025, detailed CES 2026, "in full production," volume shipping **2H
2026**. As of July 2026 that is what "the latest" means.

**Naming:** NVIDIA renamed the rack from "NVL144" (144 compute dies) to "NVL72"
(72 GPU packages) at CES 2026 — same rack: 72 packages = 144 reticle dies. The CPX
variant kept "NVL144 CPX."

| Aspect        | GB300 NVL72 (modeled now)                                             | **Vera Rubin NVL72 (latest)**                                                                  |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| GPU           | Blackwell Ultra, 208B tr, TSMC 4NP, 2 dies                            | **Rubin R200, 336B tr, TSMC N3, 2 dies**                                                       |
| HBM           | HBM3e, 288GB, ~8TB/s                                                  | **HBM4, 288GB (8 stacks), ~22TB/s** (Tom's cites ~13TB/s — flag both)                          |
| FP4 dense/GPU | ~15 PFLOPS                                                            | **35 PFLOPS** (50 PF inference w/ sparsity)                                                    |
| CPU           | Grace (72 Neoverse-V2)                                                | **Vera (88 Armv9 "Olympus", 176 threads, 227B tr, LPDDR5X ≤1.5TB)**                            |
| CPU↔GPU       | NVLink-C2C 900GB/s                                                    | **NVLink-C2C 1.8TB/s**                                                                         |
| Scale-up      | NVLink 5 (1.8TB/s/GPU), NVSwitch5                                     | **NVLink 6 (3.6TB/s/GPU), NVSwitch 6 (260TB/s/rack)**                                          |
| NIC           | ConnectX-8 (800G)                                                     | **ConnectX-9 (1.6Tb/s, embeds 48-lane PCIe6 switch)**                                          |
| DPU           | BlueField-3                                                           | **BlueField-4 (reuses Grace die + CX-9, integrates AST2600 BMC)**                              |
| Rack          | 72 GPU / 36 CPU, 18 compute + 9 switch trays; ~120-140kW; ~85% liquid | 72 GPU / 36 Vera; 18+9 trays, cable-free; **~180-220kW; 100% liquid**; Oberon rack, 50V busbar |

Sources: NVIDIA Vera Rubin POD blog, NVIDIA "Inside the Rubin platform" blog,
SemiAnalysis "Vera Rubin Extreme Co-Design" (Feb 2026), Tom's Hardware "Vera Rubin
in depth," ServeTheHome CES 2026 + GTC 2026 Pegatron rack.

**Roadmap tiers to show as future:**

- **Rubin CPX** (Sept 2025, avail. end-2026): context/prefill inference GPU, **128GB
  GDDR7, no HBM, no advanced packaging** — a _different, cheaper_ supply chain. The
  **Vera Rubin NVL144 CPX** rack = 8 EFLOPS NVFP4, 100TB, 1.7PB/s.
- **Rubin Ultra NVL576** (2H 2027): **4 reticle dies/package**, HBM4e 1TB/GPU (16
  stacks, ~32TB/s), 15 EF/rack, **Kyber rack ~600kW, 800V HVDC**, NVLink 7.
- **Feynman** (2028).
- **800V HVDC** (NVIDIA blog): 13.8kV AC → 800VDC at perimeter; supports 100kW–>1MW/
  rack; native with Kyber/Rubin Ultra 2027 (Vera Rubin NVL72 stays 50V internal).

## 2. GPU internals — the die hierarchy (currently a stub: only `sm`)

Full **GB300 (Blackwell Ultra)** on-die tree, all sourced (NVIDIA "Inside Blackwell
Ultra" blog, Chips and Cheese "B200," NVIDIA Blackwell Tuning Guide, SemiAnalysis
"Tensor Core evolution," arXiv 2512.02189, Cornell CAC):

```
package    2 dies · NV-HBI die-to-die 10 TB/s · 208B tr · TSMC 4NP
├─ GPC ×8            (4 per die)
│  └─ TPC ×10        (2 SM each)  → 8×10×2 = 160 SM (GB300 full; B200=148 floorswept)
│     └─ SM ×160     128 CUDA(FP32/INT32) + FP64 · 4 sub-partitions · 64 warps max
│        ├─ warp-sched ×4   1 scheduler+dispatch per sub-partition
│        ├─ regfile         256 KB/SM (64K × 32-bit; 64KB per sub-partition)
│        ├─ L1+shared       256 KB/SM unified (shared carve-out ≤228 KB); L1 ~39cyc
│        └─ Tensor ×4       5th-gen (NVFP4/MXFP4/FP6/FP8/BF16/TF32/FP64)
│           └─ TMEM         256 KB/SM tensor memory (128 lanes × 512 × 4B; 16 TB/s R / 8 TB/s W) ← NEW in Blackwell
├─ L2              ~126 MB/GPU · 4 partitions (2/die) · ~150 ns
└─ memctrl ×16    512-bit each → 8192-bit → 8 HBM3e stacks (12-Hi) · 288 GB · 8 TB/s
```

Per-part totals (GB300): **20,480 CUDA cores, 640 Tensor Cores, 15 PFLOPS dense
NVFP4**. SFU throughput doubled (Ultra) to 10.7 TeraExponentials/s for attention.
`tcgen05` MMA: operands in shared mem + TMEM (not registers); **MMA.2SM** spans a
CTA pair across 2 SMs.

**Variants:** B200/GB200 → 148 SM, HBM 192GB (8-Hi), ~8 TB/s. **Rubin R200 → 224
SM**, HBM4 288GB, "expanded SFU" Tensor Cores; **per-SM CUDA/TMEM/L2 not yet
disclosed** — mark those Rubin-internal nodes `gap`.

Discrepancies to encode honestly: SM=160 is full/GB300 (physical die-pair) vs 148
enabled on measured B200; GB300 HBM is 12-Hi (not 8-Hi per one source); Rubin HBM4
BW 22 vs 13 TB/s; datacenter LSU/SFU exact counts unpublished (low confidence).

## 3. Missing chips on the board (the "chips are missing")

The tray/rack has far more silicon than the 8 nodes modeled (GPU/HBM/Grace/NVSwitch/
CX-8/BF-3/BMC/PDB). **Almost all suppliers already exist in `supply-chain.ts`** —
the gap is _nodes_, not companies. Priority additions (HIGH first):

| Chip node                                   | Function                                      | TW hook (dataset id)                                                                            | Value    |
| ------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| **DrMOS / smart power stage**               | driver+MOSFET, dozens/GPU board, 1000A+ rails | 力智6719 · 致新8081 · **茂達 Anpec 6138 (already in dataset as `anpec`)** · 立錡(MediaTek 2454) | HIGH     |
| **VRM / multiphase PWM controller**         | 12V→~0.8V GPU/CPU core                        | 力智6719 · 致新8081 · 矽力6415                                                                  | HIGH     |
| **PCIe/NVLink retimer / redriver**          | re-clock Gen6 over 500mm+ midplane (Rubin)    | 譜瑞-KY 4966 (+ Astera ALAB, Montage)                                                           | HIGH     |
| **Serial NOR flash**                        | BMC/UEFI/VBIOS/FPGA config, many/board        | 華邦2344 · 旺宏2337                                                                             | MED-HIGH |
| **PCIe switch / smart fabric**              | Gen6 fan-out (CX-9 embeds one)                | — (Broadcom AVGO, Microchip, Astera)                                                            | MED-HIGH |
| **TPM / secure root-of-trust**              | TPM 2.0 (confirmed GB300) + platform RoT      | 新唐4919                                                                                        | MED      |
| **CPLD / FPGA**                             | power sequencing / glue on every tray         | — (Lattice LSCC, AMD)                                                                           | MED      |
| **NVMe / SSD controller**                   | boot + E1.S local storage                     | 群聯8299 (慧榮 SIMO = US-ADR, flag)                                                             | MED      |
| **Clock gen / jitter attenuator + crystal** | PCIe/Eth reference timing                     | 晶技3042 crystal (Renesas/SkyWorks silicon)                                                     | MED      |
| **PMIC (point-of-load)**                    | NIC/DPU/BMC/module rails; Rubin SOCAMM PMIC   | 矽力6415 · 致新8081 · 力智6719                                                                  | MED      |
| **e-fuse / hot-swap**                       | busbar inrush/OCP per tray                    | — (Infineon, TI)                                                                                | MED      |
| **temp/volt/power monitor + EC**            | PMBus telemetry to BMC                        | 新唐4919                                                                                        | LOW-MED  |
| **mgmt Ethernet PHY**                       | 1G RJ45 management port                       | 瑞昱2379                                                                                        | LOW      |

Rubin-specific additions: **SOCAMM/MRDIMM** interface silicon (SPD hub, module PMIC,
CKD, MRCD/MDB — Montage/Rambus); **BlueField-4** and **ConnectX-9**; optional **CPO/
Spectrum-6** optics on Kyber.

Sources: SemiAnalysis GB200 BOM + VR NVL72 model, Lenovo GB300 NVL72 product guide
(AST2600/TPM2.0/CX-8/BF-3 confirmed), ServeTheHome DGX GB200 teardown, Astera Labs
(Aries/Scorpio), Broadcom PEX89000, Montage memory-interface, Nuvoton TPM/eBMC,
company IR (uPI/GMT/Anpec/Winbond/Macronix/Phison/TXC).

**Caveat:** exact per-board chip _counts_ sit behind SemiAnalysis's paid BOM models;
free/teardown sources confirm categories + vendors, not full quantities. Model counts
as `sourced`, not `verified`, where unquantified.
