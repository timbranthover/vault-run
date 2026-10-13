# Cleanup audit

Baseline: `eba8785be48cbab6bf72a5aaf67c0a73faf84cda` (main). This branch is independent of the two existing PRs. Claude and Tim review before merge; no deployment is part of this change.

## Scope

Reviewed every tracked source, test, configuration and documentation file; traced the two image assets to their page/card references; checked declared dependencies against their consumers. Used a temporary, scope-aware JavaScript lint pass and manual reference tracing, including computed sprite/state lookups and public hooks. No audit tools or runtime dependencies were added to the project.

| Area | Finding / action |
| --- | --- |
| `public/game.js` | Removed unused `TOP`, four old palette constants, `vbg`, the unread transition request ID, two unused parameters, popup x bookkeeping, and room `mg` bookkeeping. Consolidated identical `grid0`/`grid` generators. Simplified three constant/redundant expressions without changing their values. |
| Game trail storage | Finished trail records accumulated for the lifetime of a run. Each new five-key trail now counts its remaining objects; the existing object-compaction pass deletes the record only when its last key is removed. No separate per-frame scan or allocation. Collection and missed-key logic still run before reclamation. |
| FPS bookkeeping | Keep the rolling 60-frame display history only with `?fps`; clear the 600-sample analytics buffer after the unchanged once-per-visit event. The diagnostic display and emitted event stay the same. |
| `public/audio.js` | Removed unused `pick`, an unused argument, and an unread interval ID. Scoped the ambient source reference to its creator. The scheduling interval, connected source, voices, mix and offline preview API remain. |
| `public/run.html`, `pages/api/r.js` | Removed an unreachable optional `play(after)` callback: both local callers invoke `play()` without an argument. Kept load-failure/retry behavior. |
| `tests/` | Removed two unused fairness-test bindings. Added a reproducible baseline comparison. Existing test controls, server and both bots are used. |
| `pages/api/scores.js`, `pages/api/card.js`, `lib/code.js` | Live code, left unchanged. Persistence retries, cache/version handling, challenge validation and image generation are not dead code. |
| Build, assets and remaining files | No proven unused module, asset or dependency. Kept Next/React plumbing, the empty 404, private-host rewrite, CI, docs and issue templates. |

## Measured effect

The production sources shrink by **372 bytes** in total (350 bytes across the three public files). This is modest download savings; the useful gains are less retained run state and less unnecessary frame bookkeeping. No FPS improvement is claimed.

The seeded phone run reached **13,381 m**: retained trail records fell from **262 to 0** at the final checkpoint. The desktop run reached **14,137 m**: **309 to 1**. The remaining record still had keys in the world. All checkpoints asserted that retained records could not outnumber remaining keys.

Without `?fps`, telemetry/display sample counts after reporting went from **60 + 600 to 0 + 0**. With `?fps`, the rolling 60 samples remain and the 600 old analytics samples are released.

## Behavior checks

`npm run test:equivalence -- eba8785be48cbab6bf72a5aaf67c0a73faf84cda`

- Runs the baseline and working code with the same seeded randomness, clock, input sequence and leaderboard.
- Compares **45 checkpoints per viewport**: every generated sprite cache, title/board/help, live timing, complete and interrupted key trails, long runs through the woods, every zone, the Other Side, server-room realization/exit, pause and game over.
- Compares canvas PNG hashes, gameplay state, RNG state, emitted sound events and analytics. Excludes only render-cost counters, deleted `mg`, and trail storage with no remaining key references; every active trail's reward/penalty state is compared.
- Uses phone **390 × 844 @ 3x** and desktop **1366 × 768**; also tests `?fps` enabled on desktop.
- Separately checks both page loaders recover from a failed script request and the game closes/reopens.
- The long traversal uses collision protection to keep testing later content; the ordinary `npm test` fairness runs do not.

`npm test` passed, including both smoke flows, the room, all 20 signatures and 4/4 fair runs reaching the woods. The production build passed. These are Chromium checks, not an exhaustive proof for every browser/device. Sound-event sequences are compared; rendered audio waveforms are not asserted byte-identical because even two baseline OfflineAudioContext renders produced different hashes.

## Deliberately retained / follow-up candidates

- The embedded-host open/close flow and exported debugging/offline preview hooks may be used outside this repository. Lack of an in-repo caller is insufficient evidence to delete them.
- The input history feeds the room's replay. Capping it earlier would change what that scene can show, so it needs a separate design decision.
- Sprite/voxel/background caches avoid rebuilding art during play. Keep them unless profiling demonstrates a better tradeoff.
- Browser/server font and challenge-code duplication helps keep the standalone client free of build/runtime coupling. Consolidating it would be an architectural change, not dead-code removal.
- The broad compact-file structure is harder to navigate than small modules, but moving the engine into modules would expand the regression surface. This PR preserves deployment and gameplay structure.
