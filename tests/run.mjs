import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Sof util modullari (React/API'ga bog'liq emas) CommonJS'ga kompilyatsiya qilinib, node:test bilan tekshiriladi.
const SOURCES = ['src/shared/lib/savings.ts', 'src/shared/lib/reportPeriod.ts', 'src/shared/lib/budgets.ts', 'src/shared/lib/period.ts', 'src/shared/lib/transactionFilters.ts', 'src/shared/lib/transactionList.ts', 'src/shared/lib/date.ts', 'src/shared/lib/categoryTokens.ts', 'src/shared/lib/returnTo.ts', 'src/shared/lib/pageTitle.ts', 'src/shared/lib/optionSearch.ts', 'src/shared/lib/chartScale.ts', 'src/shared/lib/money.ts', 'src/shared/lib/dailyLimit.ts'];
const TESTS = ['tests/savingsUi.test.cjs', 'tests/savingsApi.test.cjs', 'tests/savings.test.cjs', 'tests/reportPeriod.test.cjs', 'tests/budgets.test.cjs', 'tests/period.test.cjs', 'tests/transactionFilters.test.cjs', 'tests/transactionList.test.cjs', 'tests/categoryTokens.test.cjs', 'tests/returnTo.test.cjs', 'tests/pageTitle.test.cjs', 'tests/optionSearch.test.cjs', 'tests/chartScale.test.cjs', 'tests/money.test.cjs', 'tests/dailyLimit.test.cjs'];

const output = mkdtempSync(join(tmpdir(), 'money-manager-tests-'));
try {
  const build = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', ...SOURCES, '--ignoreConfig', '--outDir', output, '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck'], {stdio:'inherit'});
  if (build.status !== 0) process.exitCode = build.status ?? 1;
  else {
    const unit = spawnSync(process.execPath, ['--test', ...TESTS], {stdio:'inherit',env:{...process.env,TZ:'Asia/Tashkent',TEST_BUILD:output}}).status ?? 1;
    // Mock API testi ESM + TS-strip loader ishlatadi (handlers.ts/db.ts to'g'ridan-to'g'ri import).
    const mock = spawnSync(process.execPath, ['--test', 'tests/mockApi.test.mjs'], {stdio:'inherit',env:{...process.env,TZ:'Asia/Tashkent'}}).status ?? 1;
    process.exitCode = unit || mock;
  }
} finally { rmSync(output, {recursive:true,force:true}); }
