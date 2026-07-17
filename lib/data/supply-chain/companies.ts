// The full company list, assembled stage by stage in chain order.

import type { SCCompany } from './types';
import { ANCHOR_COMPANIES } from './companies/anchor';
import { BOARD_COMPANIES } from './companies/board';
import { CHIP_COMPANIES } from './companies/chip';
import { CLOUD_COMPANIES } from './companies/cloud';
import { FAB_SUPPORT_COMPANIES } from './companies/fab-support';
import { MATERIALS_COMPANIES } from './companies/materials';
import { PACKAGE_TEST_COMPANIES } from './companies/package-test';
import { SUBSYSTEM_COMPANIES } from './companies/subsystem';
import { SYSTEM_COMPANIES } from './companies/system';
import { WAFER_COMPANIES } from './companies/wafer';

export const COMPANIES: SCCompany[] = [
  ...MATERIALS_COMPANIES,
  ...FAB_SUPPORT_COMPANIES,
  ...WAFER_COMPANIES,
  ...CHIP_COMPANIES,
  ...PACKAGE_TEST_COMPANIES,
  ...BOARD_COMPANIES,
  ...SUBSYSTEM_COMPANIES,
  ...SYSTEM_COMPANIES,
  ...CLOUD_COMPANIES,
  ...ANCHOR_COMPANIES,
];
