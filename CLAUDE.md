# Notes for agents working on Vault Run

Read README.md and CONTRIBUTING.md first; their rules apply to you.

- The owner does not review code. Keep `main` always shippable: run `npm test` before every push,
  and commit straight to `main` with a clear message (or open a PR and merge it once checks pass).
- `public/game.js` is the source of truth for the game. It is deployed byte-for-byte; never minify it.
- Production (https://the-model-run.vercel.app) also serves a private page at `/` that is not in this
  repo. That is why `next.config.js` rewrites `/` to `/index.html`; leave that rewrite alone.
- Deploys are made by the maintaining agent from this repo's contents. Don't connect this repo to the
  Vercel project through Vercel's Git integration: it would drop the private page.
- Test locally with `npm run serve` (in-memory board) and `npm test`. `VKGame._G` exposes game state
  for tests; `tests/bot.js` is an autopilot.
- Visual changes: render before and after at phone size (390x844 at 3x) and desktop (1366x768).
