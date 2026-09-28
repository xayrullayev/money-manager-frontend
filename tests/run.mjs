import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Sof util modullari (React/API'ga bog'liq emas) CommonJS'ga kompilyatsiya qilinib, node:test bilan tekshiriladi.
const SOURCES = ['src/shared/lib/reportPeriod.ts', 'src/shared/lib/budgets.ts', 'src/shared/lib/period.ts', 'src/shared/lib/transactionFilters.ts', 'src/shared/lib/transactionList.ts', 'src/shared/lib/date.ts', 'src/shared/lib/categoryTokens.ts', 'src/shared/lib/returnTo.ts', 'src/shared/lib/pageTitle.ts', 'src/shared/lib/optionSearch.ts'];
const TESTS = ['tests/reportPeriod.test.cjs', 'tests/budgets.test.cjs', 'tests/period.test.cjs', 'tests/transactionFilters.test.cjs', 'tests/transactionList.test.cjs', 'tests/categoryTokens.test.cjs', 'tests/returnTo.test.cjs', 'tests/pageTitle.test.cjs', 'tests/optionSearch.test.cjs'];

const output = mkdtempSync(join(tmpdir(), 'money-manager-tests-'));
try {
  const build = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', ...SOURCES, '--ignoreConfig', '--outDir', output, '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck'], {stdio:'inherit'});
  if (build.status !== 0) process.exitCode = build.status ?? 1;
  else process.exitCode = spawnSync(process.execPath, ['--test', ...TESTS], {stdio:'inherit',env:{...process.env,TZ:'Asia/Tashkent',TEST_BUILD:output}}).status ?? 1;
} finally { rmSync(output, {recursive:true,force:true}); }
