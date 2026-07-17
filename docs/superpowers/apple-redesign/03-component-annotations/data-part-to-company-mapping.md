# Data — Part → category → companies contract (`lib/data/hardware-map.ts`)

```ts
export interface HardwarePart {
  id: PartId; // MUST match scene/glTF node names (Phase 01/02 contract)
  name: LStr; // 散熱模組 / Thermal module
  blurb: LStr; // one-liner for the card
  categoryId: string; // → CATEGORIES id (drives the company list)
  companyIds?: string[]; // explicit top ordering (else: category members, TW-listed first)
  chapters: [number, number]; // visible chapter range
  anchor: [number, number, number]; // local-space anchor on the part
  priority: number; // density tie-break (higher wins)
}
```

## Seed mapping (author all ~24; validated against lib/data/supply-chain.ts)

| PartId                  | category       | notable companyIds                                    |
| ----------------------- | -------------- | ----------------------------------------------------- |
| rack / rails            | mech           | kingslide, nanjuen, chenbro                           |
| sled chassis            | mech           | chenbro, aic3693, chenming                            |
| fanWall                 | thermal        | sunon, avc, yensun                                    |
| coldPlate / cdu         | thermal        | avc, auras, kaori, fositek                            |
| psu / powerShelf        | power          | delta, liteon, acbel, chiconypower                    |
| bbu                     | power          | dynapack, celxpert, tdhitech                          |
| board (UBB)             | pcb            | gce, tripod, compeq                                   |
| cables / busbar         | connect        | bizlink, sinbon, lotes                                |
| nic                     | icdesign       | realtek, broadcom(anchor)                             |
| bmc                     | icdesign       | aspeed, nuvoton                                       |
| gpuModule               | odm            | wistron, foxconn, quanta                              |
| heatsink (3D-VC)        | thermal        | avc, forcecon, taisol                                 |
| hbm[0..7]               | memchip→anchor | skhynix, micron, (pti packaging)                      |
| interposer              | foundry        | tsmc, umc, psmc                                       |
| substrate               | substrate      | unimicron, nanyapcb, kinsus                           |
| die                     | foundry        | tsmc                                                  |
| socket/testIf (explore) | testif         | lotes, winway, chpt                                   |
| fins/euv (ch6)          | euv/chem/si    | gudeng, greenfilter, aemc, globalwafers, asml(anchor) |

Validation: extend the graph integrity script — every `categoryId`/`companyId`
must resolve; every `PartId` must exist in the scene registry (and later the
glTF check). Runs in CI with Phase 02's `check-parts.mjs`.
