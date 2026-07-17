// Level builders in zoom order: rack → server → GPU package → transistor die.

import { buildDieLevel } from '@/lib/scene/levels/die';
import { buildPackageLevel } from '@/lib/scene/levels/package';
import { buildRackLevel } from '@/lib/scene/levels/rack';
import { buildServerLevel } from '@/lib/scene/levels/server';
import type { LevelBuilder } from '@/lib/scene/types';

export const LEVEL_BUILDERS: LevelBuilder[] = [
  buildRackLevel,
  buildServerLevel,
  buildPackageLevel,
  buildDieLevel,
];
