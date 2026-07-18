/* global process */
import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const localVars = '.dev.vars';
const backupVars = `.dev.vars.types-check-${process.pid}`;
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
let moved = false;

if (existsSync(localVars)) {
  renameSync(localVars, backupVars);
  moved = true;
}

try {
  const result = spawnSync(pnpm, ['exec', 'wrangler', 'types', '--check'], {
    stdio: 'inherit',
  });
  process.exitCode = result.status ?? 1;
} finally {
  if (moved) renameSync(backupVars, localVars);
}
