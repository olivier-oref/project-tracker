import { parseFreePct, otherRunPids } from './e2eGuard.mjs';

describe('parseFreePct', () => {
  it('reads memory_pressure output', () => {
    expect(parseFreePct('The system has 17179869184 bytes\nSystem-wide memory free percentage: 82%')).toBe(82);
  });
  it('returns null when unavailable', () => {
    expect(parseFreePct('')).toBeNull();
    expect(parseFreePct('command not found')).toBeNull();
  });
});

describe('otherRunPids', () => {
  const ps = [
    '1 0 /sbin/launchd',
    '50 1 zsh -c "echo playwright test in a heredoc"',
    '60 50 node scripts/e2e-guard.mjs pre',
    '101 1 node /x/node_modules/.bin/playwright test --project=iphone',
    '103 1 next-server (v14.2.35)',
    '104 101 /Users/o/Library/Caches/ms-playwright/webkit-2359/Playwright.app/Contents/MacOS/Playwright',
    '105 1 node /x/node_modules/.bin/playwright show-report',
  ].join('\n');
  it('finds other running `playwright test` processes', () => {
    expect(otherRunPids(ps, 60)).toEqual([101]);
  });
  it('never counts its own ancestors (e.g. a shell whose command mentions playwright test)', () => {
    expect(otherRunPids(ps, 60)).not.toContain(50);
  });
  it('excludes the run that started the guard', () => {
    expect(otherRunPids('101 1 node playwright test\n60 101 node scripts/e2e-guard.mjs pre', 60)).toEqual([]);
  });
});

import { workersFor, shouldAbort, topMemoryApps, serverPidsToKill } from './e2eGuard.mjs';

describe('workersFor', () => {
  it('tiers by free memory: min(cores-2, 70% of cores) at >=60%, half the cores at >=45%, 3 at >=30%, else 2', () => {
    expect(workersFor(82, 11)).toBe(7);
    expect(workersFor(60, 11)).toBe(7);
    expect(workersFor(59, 11)).toBe(5);
    expect(workersFor(45, 11)).toBe(5);
    expect(workersFor(44, 11)).toBe(3);
    expect(workersFor(30, 11)).toBe(3);
    expect(workersFor(29, 11)).toBe(2);
    expect(workersFor(null, 11)).toBe(2);
    expect(workersFor(undefined, 11)).toBe(2);
  });

  it('never goes below 2, even on a small machine', () => {
    expect(workersFor(90, 2)).toBe(2);
    expect(workersFor(90, 3)).toBe(2);
    expect(workersFor(90, 8)).toBe(5);
    expect(workersFor(90, 4)).toBe(2);
    expect(workersFor(59, 8)).toBe(4);
    expect(workersFor(35, 4)).toBe(2); // the middle tier never exceeds the machine's max
  });
});

describe('shouldAbort', () => {
  it('aborts below the threshold only', () => {
    expect(shouldAbort(14)).toBe(true);
    expect(shouldAbort(15)).toBe(false);
    expect(shouldAbort(null)).toBe(false);
    expect(shouldAbort(20, 25)).toBe(true);
  });
});

import { summarizeRun } from './e2eGuard.mjs';

describe('summarizeRun', () => {
  it('turns a Playwright JSON report into one log record', () => {
    const rec = summarizeRun(
      { config: { workers: 3 }, stats: { duration: 57612, expected: 61, unexpected: 0, flaky: 1, skipped: 1 } },
      { at: '2026-09-29T13:10:00Z', sha: 'abc123', trigger: 'wave-4 final', args: ['--project=iphone'], exitCode: 0, memFreeBefore: 84, memFreeMin: 80, memFreeAfter: 84, leftovers: 0 },
    );
    expect(rec).toMatchObject({ workers: 3, durationSec: 57.6, passed: 61, failed: 0, flaky: 1, skipped: 1, trigger: 'wave-4 final', memFreeMin: 80, leftoverBrowsersKilled: 0 });
  });
  it('records the server mode and build seconds (null when no build ran)', () => {
    expect(summarizeRun(null, { mode: 'prod', buildSec: 61.4 })).toMatchObject({ mode: 'prod', buildSec: 61.4 });
    expect(summarizeRun(null, { mode: 'dev', buildSec: NaN })).toMatchObject({ mode: 'dev', buildSec: null });
    expect(summarizeRun(null, {})).toMatchObject({ mode: null, buildSec: null });
  });
  it('keeps the run context when the report is missing (aborted run)', () => {
    const rec = summarizeRun(null, { exitCode: 1, memFreeMin: 12 });
    expect(rec).toMatchObject({ passed: null, failed: null, exitCode: 1, memFreeMin: 12, trigger: 'manual' });
  });
});

describe('serverPidsToKill', () => {
  const ps = ['500 1 npx next dev', '501 500 node next dev', '502 501 next-server (v14)', '700 1 next-server (v14)'].join('\n');
  it('kills every listener when there is no warm server', () => {
    expect(serverPidsToKill(['502', '700'], ps, null)).toEqual([502, 700]);
  });
  it('spares the warm pid and its descendants, kills unrelated listeners', () => {
    expect(serverPidsToKill(['502', '700'], ps, 500)).toEqual([700]);
    expect(serverPidsToKill(['500'], ps, 500)).toEqual([]);
  });
  it('survives a parent cycle and empty input', () => {
    expect(serverPidsToKill(['1'], '1 2 a\n2 1 b', 9)).toEqual([1]);
    expect(serverPidsToKill(undefined, '', 9)).toEqual([]);
  });
});

describe('topMemoryApps', () => {
  const ps = [
    ' 4194304 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ' 2097152 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Helper (Renderer).app/Contents/MacOS/x',
    '  524288 /usr/local/bin/claude',
    '  262144 /Applications/Fathom.app/Contents/MacOS/Fathom',
    '  102400 Dock',
    'garbage line',
  ].join('\n');

  it('groups helper processes under their app and sorts largest first', () => {
    expect(topMemoryApps(ps)).toEqual([
      { app: 'Google Chrome', mb: 6144 },
      { app: 'claude', mb: 512 },
      { app: 'Fathom', mb: 256 },
    ]);
  });

  it('handles empty or missing output', () => {
    expect(topMemoryApps('')).toEqual([]);
    expect(topMemoryApps(null)).toEqual([]);
  });
});
