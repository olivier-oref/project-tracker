# E2E run log

Every guarded run (`npm run e2e`, `e2e:all`, `e2e:spec`) appends one JSON line to
[`e2e-runs.jsonl`](e2e-runs.jsonl): time, commit, trigger (`E2E_TRIGGER="wave-5 final" npm run e2e:all`),
args, mode (`prod` build or `dev` server), build seconds, workers, duration, passed/failed/flaky/skipped, free memory before / lowest during / after,
leftover browsers killed. This file holds the history before automatic logging and what we learned.
Review it at each wave boundary.

## Questions this log should answer
- Which specs catch real problems vs never fail (candidates to slim down)?
- Is 3 workers the sweet spot? Would 4 be faster without memory risk (watch `memFreeMin`)?
- Could two agents run suites in parallel safely (separate servers ⇒ ~2× memory)? Only try with data: `memFreeMin` of single runs must leave headroom for a second.
- How much does the warm-server workflow save? Compare `buildSec` and `mode` over time; `memFreeMin` of high-tier (≥60% free) runs shows whether more workers are safe.
- How often do runs end with leftover browsers (should be 0 with the guard)?

## Notable runs

| When | Run | Result | Time | Setup | Learned |
|---|---|---|---|---|---|
| 2026-10-02 | setup, first run (dev) | axe: 5 unlabeled task-row controls + project-link input | 20s | iPhone, 2 workers | axe scan earned its place on day one; labels added |
| 2026-10-02 | setup PR gate (prod) | 2 failed: duplicate project names across workers | 22s | 3 devices, 5 workers | `uniquePrefix` needs a random part — workers are separate processes |

## Learnings so far
- (add what each wave teaches: which specs catch bugs, worker/memory headroom, flakiness sources)
