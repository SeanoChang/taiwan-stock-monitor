# Research [verified] — Rack anatomy, power chain, cooling chain

All claims below survived 3-vote adversarial verification (3-0) against
primary sources on 2026-07-17.

## Rack (GB300/GB200 NVL72)

48U MGX rack: **18× 1U compute trays** (each 2 Grace + 4 Blackwell on two
"Bianca" boards of 1 CPU + 2 GPU → 36 CPU / 72 GPU), **9× NVLink switch
trays** (2× NVSwitch5 @28.8Tb/s each), **8× power shelves**, 2× SN2201
management switches, single rear ~1400A DC busbar. GB300 trays: B300 GPUs,
4× ConnectX-8 SuperNIC (800G), BlueField-3 DPU, ASPEED AST2600 BMC
(★信驊 5274). Grace: 72× Neoverse V2, up to 3.1GHz, 300W, 480GB LPDDR5X.
Caveat: "1U" is the NVIDIA reference; some ODM variants are 2U.
Sources: SemiAnalysis GB200 teardown · NVIDIA DGX GB200 user guide ·
Lenovo Press GB300 · NVIDIA NVL72 reference architecture.

## Power chain (grid → GPU)

3φ 200–480Vac → 1U 33kW power shelves (6× air-cooled 5.5kW PSU, N+N) →
busbar 47.5–51.5V ("48V-class", ~50V nominal) → per-tray power distribution
board 48V→12V → Bianca board ~2,700W via 4×RapidLock 12V + 4×GND
(~6.3kW/tray). Rack totals: ~120kW IT (123.6kW w/ losses) GB200; 135kW TDP /
155kW peak GB300. **GB300 power smoothing**: power-cap on ramp, ~65J/GPU
electrolytic capacitor storage (≈half the PSU volume), GPU "burn" on
ramp-down → −30% peak grid demand (Megatron training; vendor-measured).
The photographed GB300 shelf is LITEON-built (★光寶 2301).
Gaps: 800V HVDC roadmap and board VRM/DrMOS stages did not survive — second
pass needed.
Sources: SemiAnalysis · NVIDIA DGX guide · Lenovo Press · NVIDIA power blog.

## Cooling chain

Hybrid: **~90% of heat to liquid, ~10% to air**. Loop: cold plates on CPUs,
GPUs, CX-8 NICs and all NVLink-switch parts → quick disconnects → rear rack
manifold → CDU. Secondary-loop water 2–50°C (source labels W45; strictly
ASHRAE W45 = facility supply ≤45°C), DI water or PG25.
Gaps: CDU types, UQD standards, rear-door HX, immersion, and the Taiwan
cooling vendor map (奇鋐/雙鴻/高力/富世達) — second pass.
Sources: Lenovo Press · HPE GB300 page.
