# Research — Open gaps（第二輪研究菜單）

Branches that did NOT survive adversarial verification (or weren't reached).
Each is a candidate deep-research run; ordered by product impact.

1. **光傳輸驗證** — adversarially verify the CPO/LPO numbers now held
   single-pass (9W/port, 3.5×, port counts, ship dates); add Broadcom
   Bailly/Davisson; when optics displaces copper by distance/radix; TSMC
   COUPE; ★上詮/環宇/聯亞/眾達 socket confirmation.
2. **台股 BOM 對照** — which Taiwan-listed supplier holds which NVL72
   socket, with market shares: 鴻海/廣達/緯創/緯穎 (rack & tray), 台達電/
   光寶 (power), 奇鋐/雙鴻/高力/富世達 (cooling loop), 川湖 (rails), 金像電
   (boards), 欣興/南電/景碩 (substrate), 信驊 (BMC), 力成 (HBM test?).
   Only TSMC/LITEON/ASPEED are anchored so far.
3. **Scale-out fabric 實態** — Quantum-X800 XDR vs Spectrum-X adoption,
   fat-tree vs rail-optimized topologies, oversubscription practice,
   storage tier behind (local NVMe, network storage, Grace LPDDR as cache).
4. **GPU 內部細節** — L2 cache size (Blackwell), SM scheduling/TMA, HBM
   stack internals (TSV pitch, base die function), HBM4 adoption timeline.
5. **下一代** — Vera Rubin NVL144 / NVLink 6 (3.6TB/s), Kyber rack, 800V
   HVDC power architecture, Rubin CPX.
6. **電源末端** — busbar→VRM/DrMOS conversion stages on the Bianca board,
   multi-phase counts, ★力智/杰力/致新 socket verification.
7. **散熱細節** — CDU in-rack vs in-row capacities (kW classes), UQD
   standardization (OCP), rear-door HX, immersion adoption reality.

Method note: run each as its own deep-research question (the harness's
per-run verify budget favors narrow questions — the broad run confirmed 24
claims but starved branches 6/9 and vendors).

---

## 2026-07-18 update — upstream/materials runs (items 8–11)

Four runs executed (ABF substrate / fab process steps / foundation materials /
packaging-BEOL-recycling). Research + sources landed; **verify + ticker stages
cut short by a model limit** → results are **[s] sourced, not [✓]**. Findings
folded into the four `research-verified-*` files, the tree map's 半導體上游 +
ABF sub-trees, the taxonomy, and `data-dataset-additions-semiconductor-upstream.md`.

**Now ADDRESSED (was the user's substrate/ABF/黃光/materials question):**
- ✅ ABF substrate chain — film (Ajinomoto), T-glass, foil, resist, drills,
  equipment, TW makers' AI sockets, glass-core next-gen.
- ✅ Fab process steps 黃光/蝕刻/薄膜/清洗/CMP/檢測 — machines + parts + TW周邊環.
- ✅ Foundation — wafer chain, mask chain, consumables, AI board materials.
- ✅ Packaging/BEOL/CoWoS materials + fab circular-economy loop.

**STILL OPEN after this pass:**
8.  **上游三票驗證** — re-run the adversarial-verify + ticker stages for all
    four upstream runs (cheap resume; research cached). Confirm every new
    ticker before it enters `supply-chain.ts`. **← do this next.**
9.  **結構性「無台廠」缺口** — decide how the UI represents links with no
    Taiwan-listed hook (多晶矽/坩堝/EUV 光阻/CMP slurry/ABF 膜/T-glass/超薄銅箔/
    防焊/鍍銅藥水/track/曝光機/光罩坯/光罩檢測): foreign-anchor node + gap badge,
    not a forced TW proxy.
10. **興櫃 watchlist** — 鈺祥7909/宇川7887/創鉅7918/科嶠4542 have no TWSE/TPEx
    quote; decide whether to show as non-quoted watchlist nodes.
11. **台光電 Rubin CCL 風險** — Doosan-wins-Rubin rumor (DigiTimes 2025/11) vs
    台光電 ~60% AI-CCL: track before over-weighting the CCL node.
